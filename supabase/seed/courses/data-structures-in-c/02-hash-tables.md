---
title: "Hash Tables with Open Addressing"
slug: hash-tables
summary: "A string-keyed hash map in C with FNV-1a hashing, linear probing, tombstones for deletion and automatic resizing."
section_title: "Associative structures"
---

> [!NOTE]
> Sample entry. This text is placeholder content that shows how the page looks. Replace it from the admin panel.

## From keys to slots

A vector finds element 4 instantly because 4 *is* the location. A hash table gets the same speed for arbitrary keys by computing a location from the key. A **hash function** turns the key into an integer, the integer is reduced to an index into an array of **slots**, and with luck the entry is sitting right there.

Two keys can land on the same index. With **open addressing** every entry lives in the slot array itself, and a collision is resolved by trying other slots in a fixed order. We use the simplest, **linear probing**: try the next slot, wrapping round at the end. Naive as it looks, neighbouring slots share cache lines, which makes it hard to beat in practice.

The listings below, in order, form one file, `hashmap.c`. The map stores `int` values under string keys and keeps its own copy of every key.

```c title="hashmap.c" showLineNumbers
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define INITIAL_CAPACITY 16 /* must be a power of two */

typedef enum { SLOT_EMPTY, SLOT_FULL, SLOT_TOMBSTONE } SlotState;

typedef struct {
    char *key; /* owned copy, meaningful only when state == SLOT_FULL */
    int value;
    SlotState state;
} Slot;

typedef struct {
    Slot *slots;
    size_t capacity; /* number of slots, always a power of two */
    size_t count;    /* live entries */
    size_t used;     /* live entries plus tombstones */
} HashMap;
```

## Hashing with FNV-1a

FNV-1a is a small, fast, non-cryptographic hash. Start from a fixed offset basis and, for each byte, XOR the byte in and multiply by a fixed prime. The 32-bit constants are 2166136261 for the offset basis and 16777619 for the prime.

```c title="hashmap.c"
static uint32_t fnv1a(const char *key) {
    uint32_t hash = 2166136261u;
    for (const unsigned char *p = (const unsigned char *)key; *p != '\0'; p++) {
        hash ^= *p;
        hash *= 16777619u;
    }
    return hash;
}
```

The bytes are read as `unsigned char` so that characters above 127 cannot turn into negative numbers, and the multiplication is unsigned, so it wraps modulo $2^{32}$ with no undefined behaviour. Because the capacity is a power of two, reducing the hash to an index is a single mask, `hash & (capacity - 1)`.

> [!CAUTION]
> FNV-1a is not safe against an attacker who chooses the keys. Crafted input can force every key into one long probe sequence and turn lookups linear. For untrusted input use a keyed hash such as SipHash.

## Finding a slot

All three operations start with the same walk, so it gets its own function.

```c title="hashmap.c" {7-13}
static Slot *find_slot(Slot *slots, size_t capacity, const char *key) {
    size_t index = fnv1a(key) & (capacity - 1);
    Slot *first_tombstone = NULL;

    for (;;) {
        Slot *slot = &slots[index];
        if (slot->state == SLOT_EMPTY) {
            return first_tombstone != NULL ? first_tombstone : slot;
        }
        if (slot->state == SLOT_TOMBSTONE) {
            if (first_tombstone == NULL) {
                first_tombstone = slot;
            }
        } else if (strcmp(slot->key, key) == 0) {
            return slot;
        }
        index = (index + 1) & (capacity - 1);
    }
}
```

The function returns the slot that holds `key` or, if the key is absent, the slot where it should go. An empty slot ends the search: had the key ever been inserted, it would have been placed at or before this point. A **tombstone** does not end the search, but the first one seen is remembered so that an insertion can recycle it.

The loop terminates only if an empty slot exists; the resizing policy below guarantees that a quarter of the slots always are.

## Why deletion needs tombstones

Suppose `"ash"` and `"elm"` both hash to index 3. `"ash"` arrives first and takes slot 3, so `"elm"` probes on to slot 4. Now delete `"ash"` by marking slot 3 empty. A lookup for `"elm"` starts at 3, sees an empty slot, and reports that the key is absent. The entry is still there and can no longer be reached.

| Step | Slot 3 | Slot 4 | Result of `get("elm")` |
| --- | --- | --- | --- |
| After both inserts | `ash` | `elm` | found at 4 |
| Delete by emptying slot 3 | EMPTY | `elm` | stops at 3, **not found** |
| Delete with a tombstone | TOMBSTONE | `elm` | walks past 3, found at 4 |

A tombstone says "something used to be here, keep walking". Tombstones lengthen probe sequences exactly as live entries do, so the load factor has to count them, which is what the `used` field is for.

## Load factor and resizing

The **load factor** is $\alpha = \mathit{used} / \mathit{capacity}$. For linear probing with a good hash, Knuth's classic analysis puts the expected number of probes at about

$$
\tfrac{1}{2}\left(1 + \frac{1}{1 - \alpha}\right) \text{ for a hit}, \qquad \tfrac{1}{2}\left(1 + \frac{1}{(1 - \alpha)^2}\right) \text{ for a miss or an insert.}
$$

| $\alpha$ | Probes for a hit | Probes for a miss |
| --- | --- | --- |
| 0.50 | 1.5 | 2.5 |
| 0.75 | 2.5 | 8.5 |
| 0.90 | 5.5 | 50.5 |

The curve is flat, then brutal. We keep $\alpha$ at or below 0.75.

```c title="hashmap.c"
static bool map_resize(HashMap *m, size_t new_capacity) {
    Slot *fresh = calloc(new_capacity, sizeof *fresh);
    if (fresh == NULL) {
        return false; /* the map is unchanged */
    }
    for (size_t i = 0; i < m->capacity; i++) {
        Slot *old = &m->slots[i];
        if (old->state == SLOT_FULL) {
            *find_slot(fresh, new_capacity, old->key) = *old; /* the key moves with it */
        }
    }
    free(m->slots);
    m->slots = fresh;
    m->capacity = new_capacity;
    m->used = m->count; /* the tombstones were left behind */
    return true;
}

static bool map_make_room(HashMap *m) {
    if ((m->used + 1) * 4 <= m->capacity * 3) {
        return true; /* one more entry still fits under 75% */
    }
    size_t new_capacity = m->capacity;
    if ((m->count + 1) * 2 > m->capacity) {
        if (m->capacity > SIZE_MAX / 2 / sizeof *m->slots) {
            return false;
        }
        new_capacity = m->capacity * 2;
    }
    return map_resize(m, new_capacity);
}
```

An index depends on the capacity, so entries cannot be copied across; each is reinserted into the fresh array, which `calloc` has zero-filled to `SLOT_EMPTY`. Note the second test in `map_make_room`. A table crowded mostly with tombstones is rebuilt at the *same* size, which clears them without growing. It doubles only when live entries alone pass half the capacity.

## The public functions

```c title="hashmap.c"
bool map_init(HashMap *m) {
    m->capacity = 0;
    m->count = 0;
    m->used = 0;
    m->slots = calloc(INITIAL_CAPACITY, sizeof *m->slots);
    if (m->slots == NULL) {
        return false;
    }
    m->capacity = INITIAL_CAPACITY;
    return true;
}

void map_free(HashMap *m) {
    for (size_t i = 0; i < m->capacity; i++) {
        if (m->slots[i].state == SLOT_FULL) {
            free(m->slots[i].key);
        }
    }
    free(m->slots);
    m->slots = NULL;
    m->capacity = 0;
    m->count = 0;
    m->used = 0;
}

bool map_set(HashMap *m, const char *key, int value) {
    if (!map_make_room(m)) {
        return false;
    }
    Slot *slot = find_slot(m->slots, m->capacity, key);
    if (slot->state == SLOT_FULL) {
        slot->value = value; /* existing key: overwrite in place */
        return true;
    }
    size_t length = strlen(key) + 1;
    char *copy = malloc(length);
    if (copy == NULL) {
        return false;
    }
    memcpy(copy, key, length);
    if (slot->state == SLOT_EMPTY) {
        m->used++; /* a recycled tombstone was already counted */
    }
    slot->key = copy;
    slot->value = value;
    slot->state = SLOT_FULL;
    m->count++;
    return true;
}

bool map_get(const HashMap *m, const char *key, int *out) {
    const Slot *slot = find_slot(m->slots, m->capacity, key);
    if (slot->state != SLOT_FULL) {
        return false;
    }
    *out = slot->value;
    return true;
}

bool map_delete(HashMap *m, const char *key) {
    Slot *slot = find_slot(m->slots, m->capacity, key);
    if (slot->state != SLOT_FULL) {
        return false;
    }
    free(slot->key);
    slot->key = NULL;
    slot->state = SLOT_TOMBSTONE;
    m->count--; /* used is unchanged: the slot is still occupied */
    return true;
}
```

`map_set` makes room before it looks for the key, so updating an existing key can occasionally resize a little early. That is harmless, and every failing path leaves the map exactly as it was.

## Trying it out

```c title="hashmap.c"
int main(void) {
    HashMap m;
    if (!map_init(&m)) {
        fprintf(stderr, "out of memory\n");
        return EXIT_FAILURE;
    }

    const char *words[] = {"blue", "print", "blue", "line", "blue", "print"};
    for (size_t i = 0; i < sizeof words / sizeof words[0]; i++) {
        int seen = 0;
        map_get(&m, words[i], &seen); /* leaves seen at 0 if absent */
        if (!map_set(&m, words[i], seen + 1)) {
            fprintf(stderr, "out of memory\n");
            map_free(&m);
            return EXIT_FAILURE;
        }
    }
    map_delete(&m, "line");

    int n;
    printf("blue  -> %d\n", map_get(&m, "blue", &n) ? n : 0);
    printf("print -> %d\n", map_get(&m, "print", &n) ? n : 0);
    printf("line  -> %s\n", map_get(&m, "line", &n) ? "present" : "absent");
    printf("count = %zu, used = %zu, capacity = %zu\n", m.count, m.used, m.capacity);

    map_free(&m);
    return EXIT_SUCCESS;
}
```

```text
blue  -> 3
print -> 2
line  -> absent
count = 2, used = 3, capacity = 16
```

The deleted key still occupies a slot as a tombstone, which is why `used` is one more than `count`.

## What it costs

| Operation | Expected | Worst case |
| --- | --- | --- |
| `map_get` | $O(1)$ | $O(n)$ |
| `map_set` | $O(1)$ amortized | $O(n)$ |
| `map_delete` | $O(1)$ | $O(n)$ |
| rebuild on resize | $O(n)$ | $O(n)$ |
| memory | $O(n)$ | $O(n)$ |

The expected figures assume an even hash and a bounded load factor; the worst case is every key colliding into one run of slots. Hashing and comparing a key of length $L$ adds $O(L)$. Resizing is the dynamic array argument again: a rebuild costs $\Theta(n)$ but happens only after a number of insertions proportional to $n$, so it is $O(1)$ amortized.

## Exercises

**1.** Why does `hash & (capacity - 1)` require the capacity to be a power of two? What goes wrong with a capacity of 12?

:::details[Show the solution]
When the capacity is $2^k$, `capacity - 1` is a run of $k$ one bits, so the mask keeps the low $k$ bits of the hash, exactly `hash % capacity`. Any other capacity gives a mask with zero bits inside it, and some indices can never be produced: with a capacity of 12 the mask is 11, binary 1011, so no key can ever land in slots 4 to 7. Use `%` for capacities that are not powers of two.
:::

**2.** Insert 12 distinct keys into a new map, then delete all 12. What are `count`, `used` and `capacity`? What happens on the next `map_set`?

:::details[Show the solution]
Every insert fits: before the twelfth, `used` is 11 and $(11 + 1) \cdot 4 = 48 \le 16 \cdot 3$. After the deletions `count` is 0, `used` is 12 and `capacity` is 16, because deleting leaves tombstones behind.

The next `map_set` finds $(12 + 1) \cdot 4 = 52 > 48$. Live entries are far below half the capacity, so it rebuilds at the same size, which copies nothing and drops all twelve tombstones. The insert then proceeds, leaving `count` and `used` both at 1.
:::

**3.** Write `map_for_each`, which calls a function on every live entry. What must the caller promise?

:::details[Show the solution]
```c
typedef void (*MapVisitor)(const char *key, int value, void *context);

void map_for_each(const HashMap *m, MapVisitor visit, void *context) {
    for (size_t i = 0; i < m->capacity; i++) {
        if (m->slots[i].state == SLOT_FULL) {
            visit(m->slots[i].key, m->slots[i].value, context);
        }
    }
}
```

The caller must not insert or delete during the walk, since a resize would free the array being iterated. The order is slot order, not insertion order, and it changes whenever the table is rebuilt.
:::
