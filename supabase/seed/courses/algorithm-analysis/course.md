---
title: "Algorithm Analysis Essentials"
slug: algorithm-analysis
summary: "Predict how code scales before you run it: asymptotic notation, recurrences and the master theorem, and amortized analysis, with proofs you can follow and exercises with solutions."
level: beginner
topics: [algorithms, complexity, big-o, recurrences, amortized-analysis]
featured: true
position: 1
published_at: 2026-07-01
links:
  - course: data-structures-in-c
    relation: next
---

> [!NOTE]
> Sample entry. This text is placeholder content that shows how the page looks. Replace it from the admin panel.

Two programs can give the same answer and still be very different programs. One finishes in a second on a million records. The other is still running tomorrow. This course is about telling them apart on paper, before either one is written.

It is a short introduction for people who can already program a little and want the vocabulary the rest of computer science takes for granted. No prior theory is assumed. Each lesson builds one tool, proves that it works, and uses it on code you will recognise.

By the end you will be able to:

- state what $O$, $\Omega$ and $\Theta$ mean, and prove a bound from the definition
- turn a recursive function into a recurrence and solve it with a recursion tree or the master theorem
- explain why an operation that is occasionally slow can still be cheap on average, using amortized analysis

## What you need

- Comfort reading short programs (the examples are in Python)
- School algebra: exponents, logarithms and summing a simple series
- Pen and paper. No calculus and no previous exposure to proofs

## How to use it

Read the lessons in order, since each leans on the one before. Work the exercises on paper before opening the solutions; a proof only becomes yours once you have tried to write it. When you finish, the course on data structures in C puts these tools to work on real implementations.
