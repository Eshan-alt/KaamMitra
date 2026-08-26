---
name: Named API route ordering
description: Preventing parameterized Express routes from shadowing named resource endpoints.
---

Parameterized Express routes can capture named endpoints when they are registered first, turning a path such as a dashboard URL into an invalid resource ID. Prefer numeric or otherwise constrained parameters for ID routes, and keep named endpoints unambiguous.

**Why:** The worker dashboard was reachable in the code but was intercepted by the public worker-by-ID route until the ID parameter was constrained.

**How to apply:** When adding an endpoint with a reserved path segment, check neighboring parameter routes and constrain their parameters or register the reserved route first.