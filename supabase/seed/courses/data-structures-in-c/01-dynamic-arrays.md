---
title: "Dynamic Arrays"
slug: dynamic-arrays
summary: "A growable int vector with push, pop and get, doubling growth, and the realloc mistakes that quietly corrupt programs."
section_title: "Linear structures"
---

> [!NOTE]
> Sample entry. This text is placeholder content that shows how the page looks. Replace it from the admin panel.

## Three numbers

A C array has a fixed length, chosen when it is created. A **dynamic array** (a vector) hides that limit behind three fields: a pointer to a heap block, the number of elements in use (`size`), and the number of elements the block can hold (`capacity`). When `size` reaches `capacity`, the vector moves to a bigger block. Everything else is ordinary array indexing, which is why vectors are the default sequence type in most languages.

The listings in this lesson, in order, form one file, `vector.c`.

```c title="vector.c" showLineNumbers
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int *data;
    size_t size;
    size_t capacity;
} IntVector;

void vec_init(IntVector *v) {
    v->data = NULL;
    v->size = 0;
    v->capacity = 0;
}

void vec_free(IntVector *v) {
    free(v->data);
    vec_init(v);
}
```

An empty vector owns no memory at all. That is safe because `free(NULL)` does nothing and, as we will see, `realloc(NULL, n)` behaves like `malloc(n)`, so the first allocation needs no special case.

## Growing

```c title="vector.c" {11-15}
static bool vec_grow(IntVector *v) {
    size_t new_capacity;
    if (v->capacity == 0) {
        new_capacity = 8;
    } else if (v->capacity > SIZE_MAX / 2 / sizeof *v->data) {
        return false; /* doubling would overflow size_t */
    } else {
        new_capacity = v->capacity * 2;
    }

    int *grown = realloc(v->data, new_capacity * sizeof *grown);
    if (grown == NULL) {
        return false; /* v->data is untouched and still valid */
    }
    v->data = grown;
    v->capacity = new_capacity;
    return true;
}
```

The highlighted lines are the part people get wrong.

> [!WARNING]
> Never write `v->data = realloc(v->data, n);`. When `realloc` fails it returns `NULL` and leaves the original block allocated. Assigning the result straight back overwrites your only pointer to that block, so you leak every element and then dereference `NULL`. Receive the result in a temporary, check it, and only then commit.

**The old pointer dies.** On success `realloc` may extend the block in place or move it somewhere else. Assume it moved. Any pointer you kept into the old block, such as `int *p = &v.data[3]`, is invalid after the next push that grows the vector. Hold on to indices, not addresses.

**The size can overflow.** `new_capacity * sizeof(int)` is unsigned arithmetic, and unsigned arithmetic wraps silently. A wrapped product asks for a tiny block while the vector believes it has a huge one, and every later write lands outside it. The check against `SIZE_MAX` makes the function fail cleanly instead.

One more rule: do not call `realloc` with a size of zero, whose behaviour the standard leaves to the implementation. `vec_grow` never does, because the smallest capacity it requests is 8.

## Push, pop and get

```c title="vector.c"
bool vec_push(IntVector *v, int value) {
    if (v->size == v->capacity && !vec_grow(v)) {
        return false;
    }
    v->data[v->size++] = value;
    return true;
}

bool vec_pop(IntVector *v, int *out) {
    if (v->size == 0) {
        return false;
    }
    v->size--;
    if (out != NULL) {
        *out = v->data[v->size];
    }
    return true;
}

bool vec_get(const IntVector *v, size_t index, int *out) {
    if (index >= v->size) {
        return false;
    }
    *out = v->data[index];
    return true;
}
```

Every function that can fail returns `bool` and delivers the value through an out parameter. That keeps the whole range of `int` available as data, where a sentinel such as `-1` would not. Note what a failed push guarantees: the vector is exactly as it was, with all its elements, and the caller decides what to do next. Note also that `vec_get` checks against `size`, not `capacity`. Slots between the two are allocated but hold no meaningful values.

`vec_pop` does not shrink the block. Shrinking is optional, and surprisingly easy to get wrong (exercise 3).

## Trying it out

```c title="vector.c"
int main(void) {
    IntVector v;
    vec_init(&v);

    for (int i = 1; i <= 20; i++) {
        if (!vec_push(&v, i * i)) {
            fprintf(stderr, "out of memory\n");
            vec_free(&v);
            return EXIT_FAILURE;
        }
    }

    int value;
    if (vec_get(&v, 4, &value)) {
        printf("v[4] = %d\n", value);
    }
    while (v.size > 17 && vec_pop(&v, &value)) {
        printf("popped %d\n", value);
    }
    printf("size = %zu, capacity = %zu\n", v.size, v.capacity);

    vec_free(&v);
    return EXIT_SUCCESS;
}
```

```text
v[4] = 25
popped 400
popped 361
popped 324
size = 17, capacity = 32
```

Twenty pushes needed three allocations, of 8, 16 and 32 slots.

## What it costs

| Operation | Worst case | Amortized |
| --- | --- | --- |
| `vec_get` | $O(1)$ | $O(1)$ |
| `vec_pop` | $O(1)$ | $O(1)$ |
| `vec_push` | $O(n)$ | $O(1)$ |
| insert at index $i$ (exercise 2) | $O(n)$ | $O(n)$ |

A single push can cost $\Theta(n)$, because a moving `realloc` copies every element. But the capacity doubles each time, so over $n$ pushes the copies total at most $8 + 16 + 32 + \dots < 2n$, and with the $n$ writes the whole sequence costs under $3n$. This is the aggregate argument from the amortized analysis lesson, and the potential function $\Phi = 2 \cdot \mathit{size} - \mathit{capacity}$ proves the same bound. The price is memory: up to half the block can be unused. In practice `realloc` can often extend a block in place and copy nothing, but the analysis has to assume the worst.

The growth factor does not have to be 2. Any constant factor above 1 gives $O(1)$ amortized pushes, and smaller factors such as 1.5 trade a few more copies for less wasted space. Growing by a fixed *amount* does not work. It makes $n$ pushes cost $\Theta(n^2)$.

## Exercises

**1.** Write `bool vec_reserve(IntVector *v, size_t min_capacity)`, which makes sure the capacity is at least `min_capacity` using a single allocation. When is it useful?

:::details[Show the solution]
```c
bool vec_reserve(IntVector *v, size_t min_capacity) {
    if (min_capacity <= v->capacity) {
        return true;
    }
    if (min_capacity > SIZE_MAX / sizeof *v->data) {
        return false;
    }
    int *grown = realloc(v->data, min_capacity * sizeof *grown);
    if (grown == NULL) {
        return false;
    }
    v->data = grown;
    v->capacity = min_capacity;
    return true;
}
```

If you know you are about to push a million values, one reservation replaces eighteen separate allocations, seventeen of which may copy. The requested size is never zero here, because `min_capacity` is strictly greater than a capacity that is at least 0.
:::

**2.** Write `vec_insert`, which inserts a value at `index` and shifts the tail to the right. Which library function must do the shifting, and why?

:::details[Show the solution]
```c
bool vec_insert(IntVector *v, size_t index, int value) {
    if (index > v->size) {
        return false;
    }
    if (v->size == v->capacity && !vec_grow(v)) {
        return false;
    }
    memmove(&v->data[index + 1], &v->data[index],
            (v->size - index) * sizeof *v->data);
    v->data[index] = value;
    v->size++;
    return true;
}
```

It needs `#include <string.h>`. The source and destination ranges overlap, so it must be `memmove`. Calling `memcpy` on overlapping ranges is undefined behaviour. The cost is $\Theta(n - i)$ for the shift, so inserting at the front is linear no matter how much capacity is spare.
:::

**3.** Suppose `vec_pop` halves the capacity whenever the vector becomes half full. Describe a sequence of operations that makes every call cost $\Theta(n)$, and fix the policy.

:::details[Show the solution]
Fill the vector to a boundary, say `size == capacity == 16`. A push doubles the block to 32 and copies. A pop brings the size back to 16, which is half of 32, so the block is halved and copied again. Alternate push and pop and every operation reallocates.

The fix is a gap between the two thresholds: double when full, but halve only when the vector is a quarter full. After either kind of resize the block is half full, so at least `capacity / 4` operations must happen before the next one, and those cheap operations pay for it.
:::
