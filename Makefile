.PHONY: bootstrap doctor

bootstrap:
	corepack enable
	corepack prepare pnpm@11.21.0 --activate
	pnpm install
	pnpm build:core

doctor:
	@node --version
	@pnpm --version
	@test -f pnpm-lock.yaml
