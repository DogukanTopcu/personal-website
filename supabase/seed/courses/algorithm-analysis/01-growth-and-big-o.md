---
title: "Growth Rates and Big O"
slug: growth-and-big-o
summary: "Why we count steps instead of seconds, and how to prove an asymptotic bound from the definition."
section_title: "Foundations"
---

> [!NOTE]
> Sample entry. This text is placeholder content that shows how the page looks. Replace it from the admin panel.

## Why we count steps

Timing a program tells you about one machine, one compiler and one input. Change any of them and the number changes. To compare algorithms rather than computers, we count **basic operations** (a comparison, an addition, an array access) as a function of the input size $n$, and ask how that count grows.

```python title="linear_search.py"
def linear_search(items, target):
    for i, item in enumerate(items):
        if item == target:
            return i
    return -1
```

If `target` is absent, the loop makes $n$ comparisons. If it sits at the front, one. When nothing else is said, we analyse the **worst case**, because it is a guarantee: no input of size $n$ can cost more.

Exact counts are fragile, and whether an iteration is three operations or five does not change the shape of the curve. Asymptotic notation keeps the shape and discards the rest.

## The three definitions

Let $f$ and $g$ be functions from the positive integers to the non-negative reals.

**Upper bound.** $f(n) = O(g(n))$ if there are constants $c > 0$ and $n_0 \ge 1$ such that

$$
f(n) \le c \cdot g(n) \quad \text{for all } n \ge n_0 .
$$

**Lower bound.** $f(n) = \Omega(g(n))$ if there are constants $c > 0$ and $n_0 \ge 1$ such that

$$
f(n) \ge c \cdot g(n) \quad \text{for all } n \ge n_0 .
$$

**Tight bound.** $f(n) = \Theta(g(n))$ if both hold, that is, if there are constants $c_1, c_2 > 0$ and $n_0 \ge 1$ such that

$$
c_1 \cdot g(n) \le f(n) \le c_2 \cdot g(n) \quad \text{for all } n \ge n_0 .
$$

Two constants do all the work: $c$ says we do not care about constant factors, and $n_0$ says we do not care about small inputs. The equals sign is a historical abuse of notation. $O(g(n))$ is really a *set* of functions and $f$ is a member of it, so read it as "is", never as an equation you can turn around.

## A worked proof

**Claim.** $3n^2 + 5n = O(n^2)$.

To prove it we must produce a $c$ and an $n_0$. For every $n \ge 1$ we have $n \le n^2$, so

$$
3n^2 + 5n \;\le\; 3n^2 + 5n^2 \;=\; 8n^2 .
$$

Choose $c = 8$ and $n_0 = 1$. That is the entire proof.

The witnesses are not unique. For $n \ge 5$ we have $5n \le n^2$, so $c = 4$, $n_0 = 5$ works just as well. A smaller $c$ usually costs a larger $n_0$.

The lower bound is easier. $3n^2 + 5n \ge 3n^2$ for all $n \ge 1$, so $3n^2 + 5n = \Omega(n^2)$ with $c = 3$. Both bounds together give $3n^2 + 5n = \Theta(n^2)$.

> [!TIP]
> To show a polynomial with positive coefficients is $O(n^k)$, replace every lower power of $n$ by $n^k$ and add up the coefficients. That sum is a valid $c$ with $n_0 = 1$.

## Common growth rates

| Growth | Name | Typical source | Steps at $n = 1000$ |
| --- | --- | --- | --- |
| $1$ | constant | array index, hash lookup | $1$ |
| $\log n$ | logarithmic | binary search | $\approx 10$ |
| $n$ | linear | one pass over the input | $10^3$ |
| $n \log n$ | linearithmic | merge sort | $\approx 10^4$ |
| $n^2$ | quadratic | all pairs, insertion sort | $10^6$ |
| $n^3$ | cubic | naive matrix multiplication | $10^9$ |
| $2^n$ | exponential | all subsets | $\approx 10^{301}$ |
| $n!$ | factorial | all permutations | $\approx 4 \times 10^{2567}$ |

A machine doing a billion steps per second finishes the first six rows in a second or less. It will not finish the last two before the sun burns out. That gap, not a factor of two here or there, is what asymptotic analysis is for.

## Common mistakes

1. **Reading $O$ as "exactly".** $n = O(n^2)$ is true, and useless. $O$ is an upper bound. When you mean a tight bound, say $\Theta$.
2. **Confusing the bound with the case.** Worst, best and average case choose *which function* to study. $O$, $\Omega$ and $\Theta$ describe *how that function grows*. Insertion sort is $\Theta(n^2)$ in the worst case and $\Theta(n)$ in the best, and both statements are tight.
3. **Keeping constants.** $O(2n + 3)$ is simply $O(n)$. The base of a logarithm disappears the same way, since $\log_a n$ and $\log_b n$ differ only by the constant factor $\log_b a$.
4. **Dropping constants from an exponent.** That rule does not extend upstairs. $2^{2n} = 4^n$ is *not* $O(2^n)$.
5. **Forgetting $n_0$.** An $O(n \log n)$ algorithm can lose to an $O(n^2)$ one on small inputs. This is why real sorting libraries switch to insertion sort for short runs.

## Exercises

**1.** Prove from the definition that $5n + 20 = O(n)$. Give explicit values of $c$ and $n_0$.

:::details[Show the solution]
For $n \ge 20$ we have $20 \le n$, so $5n + 20 \le 6n$. Take $c = 6$ and $n_0 = 20$. Other pairs work too, such as $c = 25$ with $n_0 = 1$.
:::

**2.** True or false: (a) $2^{n+1} = O(2^n)$, (b) $2^{2n} = O(2^n)$.

:::details[Show the solution]
(a) True. $2^{n+1} = 2 \cdot 2^n$, so $c = 2$ and $n_0 = 1$ satisfy the definition.

(b) False. $2^{2n} = 2^n \cdot 2^n$. If $2^n \cdot 2^n \le c \cdot 2^n$ held for all large $n$, dividing by $2^n$ would give $2^n \le c$, which no constant satisfies. Adding a constant to an exponent multiplies by a constant. Multiplying the exponent changes the growth rate.
:::

**3.** How many times does the comparison on the highlighted line run, as a function of $n$? Give a $\Theta$ bound and justify it.

```python title="count_pairs.py" {6}
def count_pairs(items):
    n = len(items)
    count = 0
    for i in range(n):
        for j in range(i + 1, n):
            if items[i] == items[j]:
                count += 1
    return count
```

:::details[Show the solution]
For a fixed $i$ the inner loop runs $n - 1 - i$ times, so the comparison runs

$$
\sum_{i=0}^{n-1} (n - 1 - i) = (n-1) + (n-2) + \dots + 1 + 0 = \frac{n(n-1)}{2}
$$

times, on every input. For the upper bound, $\frac{n(n-1)}{2} \le \frac{1}{2} n^2$. For the lower bound, when $n \ge 2$ we have $n - 1 \ge \frac{n}{2}$, so $\frac{n(n-1)}{2} \ge \frac{1}{4} n^2$. With $c_1 = \frac{1}{4}$, $c_2 = \frac{1}{2}$ and $n_0 = 2$, the count is $\Theta(n^2)$.
:::
