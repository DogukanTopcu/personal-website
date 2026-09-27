---
title: "Amortized Analysis"
slug: amortized-analysis
summary: "Three ways to show that an occasionally expensive operation is cheap on average: aggregate, accounting and potential."
section_title: "Going further"
---

> [!NOTE]
> Sample entry. This text is placeholder content that shows how the page looks. Replace it from the admin panel.

## The problem with worst cases

Appending to a dynamic array is usually one write. Occasionally the array is full and the append has to allocate a bigger block and copy everything across, which costs $\Theta(n)$. A plain worst-case analysis says $n$ appends at $O(n)$ each, so $O(n^2)$. That bound is true and badly pessimistic: the expensive appends are rare, and each one buys a long run of cheap ones.

**Amortized analysis** bounds the total cost of any sequence of $n$ operations and divides by $n$. No probability is involved: it is a worst-case guarantee for the sequence rather than for a single call.

- **Dynamic array.** Empty, with capacity 0. The first append allocates one slot. After that, an append to a full array doubles the capacity and copies every element. A write or a copy costs 1.
- **Binary counter.** $k$ bits, starting at zero. Incrementing flips trailing 1s to 0, then flips one 0 to 1. A flip costs 1.

```python title="counter.py"
def increment(bits):
    """bits[0] is the least significant bit."""
    i = 0
    while i < len(bits) and bits[i] == 1:
        bits[i] = 0
        i += 1
    if i < len(bits):
        bits[i] = 1
```

## Aggregate method

Add up the real cost of the whole sequence.

**Array.** $n$ appends make $n$ writes. Copies happen at sizes $1, 2, 4, 8, \dots$ below $n$, and a copy at size $2^j$ costs $2^j$, so

$$
\text{total} \;\le\; n + \sum_{j=0}^{\lfloor \log_2 n \rfloor} 2^j \;<\; n + 2n \;=\; 3n .
$$

An append therefore costs below 3 amortized, which is $O(1)$.

**Counter.** Bit $j$ flips on every $2^j$-th increment, so over $n$ increments the flips total

$$
\sum_{j=0}^{k-1} \left\lfloor \frac{n}{2^j} \right\rfloor \;<\; n \sum_{j=0}^{\infty} \frac{1}{2^j} \;=\; 2n ,
$$

and an increment costs less than 2 amortized, even though a single one can flip all $k$ bits.

## Accounting method

Charge each operation a fixed **amortized price**. When the price exceeds the real cost, bank the difference as credit on the data structure; when an operation is expensive, pay from the bank. The analysis is valid as long as the balance never goes negative.

**Array.** Charge 3 per append: one unit pays for the write, two are stored on the new element. When an array of capacity $m$ fills up, the $m/2$ elements added since the last resize hold $m$ units between them, exactly enough to copy all $m$ elements.

**Counter.** Charge 2 per increment. One unit pays for setting a bit to 1 and the other stays on that bit to pay for clearing it later. Each increment sets at most one bit, so every 1 in the counter carries the unit needed to reset it, and resets are free.

## Potential method

Instead of crediting individual elements, describe the bank balance as a function of the whole state. A **potential function** $\Phi$ maps each state $D_i$ to a number, with $\Phi(D_0) = 0$ and $\Phi(D_i) \ge 0$ for all $i$. The amortized cost of operation $i$ is defined as

$$
\hat{c}_i = c_i + \Phi(D_i) - \Phi(D_{i-1}) .
$$

Summed over the sequence, the potentials telescope:

$$
\sum_{i=1}^{n} \hat{c}_i = \sum_{i=1}^{n} c_i + \Phi(D_n) - \Phi(D_0) \;\ge\; \sum_{i=1}^{n} c_i ,
$$

so the total amortized cost bounds the total real cost from above.

**Array.** Take $\Phi = 2 \cdot \mathit{size} - \mathit{capacity}$. The empty array has $\Phi = 0$, and because an append-only array is always at least half full once the first slot exists, $\Phi \ge 0$ throughout. Two cases.

*No resize.* The real cost is 1. The size grows by one and the capacity is unchanged, so $\Phi$ rises by 2:

$$
\hat{c}_i = 1 + 2 = 3 .
$$

*Resize.* Before the append, $\mathit{size} = \mathit{capacity} = m$, so $\Phi = 2m - m = m$. Afterwards $\mathit{size} = m + 1$ and $\mathit{capacity} = 2m$, so $\Phi = 2(m + 1) - 2m = 2$. The real cost is $m$ copies plus one write:

$$
\hat{c}_i = (m + 1) + (2 - m) = 3 .
$$

The potential climbs by 2 on every cheap append and stands at exactly $m$ when a copy of $m$ elements falls due, so the expensive operation is paid for by the drop in potential. (The first append, from capacity 0 to 1, costs only 2.)

**Counter.** Take $\Phi$ to be the number of 1 bits. If an increment clears $t$ bits, its real cost is at most $t + 1$ and the potential changes by at most $1 - t$, so $\hat{c}_i \le (t + 1) + (1 - t) = 2$.

## Exercises

**1.** Suppose the array grows by a fixed 100 slots instead of doubling. What is the amortized cost of an append?

:::details[Show the solution]
Resizes happen every 100 appends and copy $100, 200, 300, \dots$ elements, so the copies over $n$ appends total

$$
100 \left(1 + 2 + \dots + \frac{n}{100}\right) \approx \frac{n^2}{200} = \Theta(n^2).
$$

The amortized cost per append is $\Theta(n)$. Growth has to be *geometric* for the cheap appends to pay for the expensive ones.
:::

**2.** A queue is built from two stacks. `enqueue` pushes onto `inbox`. `dequeue` pops from `outbox`, but if `outbox` is empty it first pops every element from `inbox` and pushes it onto `outbox`. With each push and pop costing 1, use a potential function to show that both operations are $O(1)$ amortized.

:::details[Show the solution]
Let $\Phi = 2 \cdot \mathit{len}(\mathit{inbox})$. It starts at 0 and is never negative.

- `enqueue`: real cost 1, $\Phi$ rises by 2, amortized cost 3.
- `dequeue` without a transfer: real cost 1, $\Phi$ unchanged, amortized cost 1.
- `dequeue` with a transfer of $m$ elements: real cost $2m + 1$, $\Phi$ falls by $2m$, amortized cost 1.
:::

**3.** Add a `decrement` operation to the binary counter. Show that a sequence of $n$ operations can now cost $\Theta(nk)$.

:::details[Show the solution]
Bring the counter to $2^{k-1} - 1$, which is $0111\dots1$. An increment flips all $k$ bits to give $1000\dots0$, and a decrement flips them all back. Alternating the two costs $k$ per operation indefinitely. The potential argument breaks because a decrement can *raise* the number of 1 bits by $k - 1$ without paying for it. An amortized bound belongs to a set of operations, not to a data structure alone.
:::
