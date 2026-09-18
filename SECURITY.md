# Security Policy

## Reporting a vulnerability

Please do not post passwords, API keys, payment data, personal documents, access tokens, or vulnerability details in a public issue.

Report security concerns through the product's official contact/help page. Include only the minimum information needed to reproduce the issue. Do not include real customer data.

## Secret handling

Production secrets belong only in managed secret stores or environment variables. They must never be committed to this repository, pasted into public issues, or embedded in browser code.

## Supported production branch

Security fixes target the current production branch, `main`.
