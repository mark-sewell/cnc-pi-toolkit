.PHONY: lint syntax fmt check

lint:
	shellcheck $$(find . -type f -name "*.sh")

syntax:
	find . -type f -name "*.sh" -exec bash -n {} \;

fmt:
	shfmt -w .

check: lint syntax

