---
title: "Recurrences and the Master Theorem"
slug: recurrences-and-the-master-theorem
summary: "Turn a divide and conquer algorithm into a recurrence, then solve it with a recursion tree or the master theorem."
section_title: "Foundations"
---

> [!NOTE]
> Sample entry. This text is placeholder content that shows how the page looks. Replace it from the admin panel.

## Where recurrences come from

A loop's cost is a sum. A recursive function's cost is a **recurrence**, an equation that defines $T(n)$ in terms of $T$ on smaller inputs. Divide and conquer algorithms produce recurrences of one shape. They split a problem of size $n$ into $a$ subproblems of size $n/b$, solve each recursively, and spend $f(n)$ on splitting and combining:

$$
T(n) = a\,T(n/b) + f(n), \qquad T(1) = \Theta(1).
$$

Merge sort is the standard example.

```python title="merge_sort.py" {5-6} showLineNumbers
def merge_sort(items):
    if len(items) <= 1:
        return list(items)
    mid = len(items) // 2
    left = merge_sort(items[:mid])
    right = merge_sort(items[mid:])
    return merge(left, right)


def merge(left, right):
    merged = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1
    merged.extend(left[i:])
    merged.extend(right[j:])
    return merged
```

The two highlighted calls each receive half the list, so $a = 2$ and $b = 2$. Slicing and `merge` both touch every element once, so $f(n) = \Theta(n)$. Writing $cn$ for that linear work, the recurrence is

$$
T(n) = 2\,T(n/2) + cn .
$$

## The recursion tree

Draw the calls as a tree and add up the work level by level. Assume $n$ is a power of two.

| Level | Subproblems | Size of each | Work on this level |
| --- | --- | --- | --- |
| $0$ | $1$ | $n$ | $cn$ |
| $1$ | $2$ | $n/2$ | $2 \cdot c(n/2) = cn$ |
| $2$ | $4$ | $n/4$ | $4 \cdot c(n/4) = cn$ |
| $i$ | $2^i$ | $n/2^i$ | $cn$ |
| $\log_2 n$ | $n$ | $1$ | $cn$ |

Every level costs $cn$ and there are $\log_2 n + 1$ levels, so

$$
T(n) = cn(\log_2 n + 1) = \Theta(n \log n).
$$

The tree also shows what can happen in general. Going down the tree, the work per level can *shrink* (the root dominates), stay *equal* (every level matters), or *grow* (the leaves dominate). The master theorem is that observation made precise.

## The master theorem

Let $a \ge 1$ and $b > 1$ be constants, let $f(n)$ be asymptotically positive, and let $T(n) = a\,T(n/b) + f(n)$, where $n/b$ may be rounded up or down. Compare $f(n)$ with $n^{\log_b a}$, which is the number of leaves in the recursion tree.

1. **Leaves dominate.** If $f(n) = O(n^{\log_b a - \varepsilon})$ for some constant $\varepsilon > 0$, then $T(n) = \Theta(n^{\log_b a})$.
2. **Balanced.** If $f(n) = \Theta(n^{\log_b a})$, then $T(n) = \Theta(n^{\log_b a} \log n)$.
3. **Root dominates.** If $f(n) = \Omega(n^{\log_b a + \varepsilon})$ for some constant $\varepsilon > 0$, and if $a\,f(n/b) \le c\,f(n)$ for some constant $c < 1$ and all sufficiently large $n$, then $T(n) = \Theta(f(n))$.

The extra requirement in case 3 is the **regularity condition**. It says the work really does shrink by a constant factor from each level to the next. Ordinary polynomials satisfy it, but it has to be checked.

> [!IMPORTANT]
> The $\varepsilon$ matters. In cases 1 and 3, $f(n)$ must differ from $n^{\log_b a}$ by a *polynomial* factor $n^{\varepsilon}$. Being smaller or larger by a logarithm is not enough, and such recurrences fall into a gap the theorem does not cover.

## Worked examples

| Algorithm | Recurrence | $n^{\log_b a}$ | Case | Result |
| --- | --- | --- | --- | --- |
| Binary search | $T(n) = T(n/2) + \Theta(1)$ | $n^0 = 1$ | 2 | $\Theta(\log n)$ |
| Merge sort | $T(n) = 2T(n/2) + \Theta(n)$ | $n$ | 2 | $\Theta(n \log n)$ |
| Karatsuba multiplication | $T(n) = 3T(n/2) + \Theta(n)$ | $n^{\log_2 3} \approx n^{1.585}$ | 1 | $\Theta(n^{\log_2 3})$ |
| (no name) | $T(n) = 2T(n/2) + n^2$ | $n$ | 3 | $\Theta(n^2)$ |

**Binary search.** $a = 1$ and $b = 2$, so $n^{\log_2 1} = n^0 = 1$. The driving function $\Theta(1)$ is of the same order. Case 2 gives $\Theta(\log n)$.

**Karatsuba.** Three half-size multiplications plus linear work. Since $n = O(n^{1.585 - \varepsilon})$ with, say, $\varepsilon = 0.5$, case 1 applies and the leaves dominate. This is how the algorithm beats the schoolbook $\Theta(n^2)$ method.

**The last row.** Here $n^2 = \Omega(n^{1 + \varepsilon})$ with $\varepsilon = 1$. Regularity: $a\,f(n/b) = 2(n/2)^2 = \tfrac{1}{2} n^2$, so $c = \tfrac{1}{2}$ works. Case 3 gives $\Theta(n^2)$.

## When it does not apply

Consider $T(n) = 2T(n/2) + n \log n$. Here $n^{\log_b a} = n$, and $f(n) = n \log n$ is larger, but only by a factor of $\log n$, which grows more slowly than any $n^{\varepsilon}$. Case 3 fails, case 2 fails, and the theorem is silent.

The recursion tree still works. Level $i$ has $2^i$ subproblems of size $n/2^i$, so the level costs $2^i \cdot \frac{n}{2^i} \log_2 \frac{n}{2^i} = n(\log_2 n - i)$. Summing over the levels $i = 0, \dots, \log_2 n - 1$:

$$
\sum_{i=0}^{\log_2 n - 1} n(\log_2 n - i) \;=\; n \sum_{k=1}^{\log_2 n} k \;=\; n \cdot \frac{\log_2 n\,(\log_2 n + 1)}{2} \;=\; \Theta(n \log^2 n).
$$

The leaves add only $\Theta(n)$ more, so $T(n) = \Theta(n \log^2 n)$.

The theorem also says nothing about recurrences that are not of its shape: subproblems of unequal size, such as $T(n) = T(n/3) + T(2n/3) + n$, or "subtract and conquer" recurrences such as $T(n) = T(n-1) + n$. Use a tree or unrolling for those.

## Exercises

Solve each recurrence, naming the case if the master theorem applies.

**1.** $T(n) = 4T(n/2) + n$

:::details[Show the solution]
$n^{\log_2 4} = n^2$, and $f(n) = n = O(n^{2 - \varepsilon})$ with $\varepsilon = 1$. Case 1: $T(n) = \Theta(n^2)$.
:::

**2.** $T(n) = 3T(n/4) + n \log n$

:::details[Show the solution]
$n^{\log_4 3} \approx n^{0.793}$, and $f(n) = n \log n = \Omega(n^{0.793 + \varepsilon})$ with $\varepsilon = 0.2$. Regularity: $3 \cdot \frac{n}{4} \log \frac{n}{4} \le \frac{3}{4}\, n \log n$, so $c = \frac{3}{4}$. Case 3: $T(n) = \Theta(n \log n)$.
:::

**3.** $T(n) = T(n-1) + n$, with $T(0) = 0$

:::details[Show the solution]
The subproblem shrinks by subtraction, not division, so the master theorem does not apply. Unroll it instead:

$$
T(n) = n + (n-1) + \dots + 1 = \frac{n(n+1)}{2} = \Theta(n^2).
$$

This is the recurrence for selection sort, and for quicksort when every pivot happens to be the smallest element.
:::
