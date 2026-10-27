<script lang="ts">
	import { Popover } from 'bits-ui';
	import type { Snippet } from 'svelte';

	let { hint, children }: { hint: string; children?: Snippet } = $props();
</script>

<Popover.Root>
	<Popover.Trigger
		openOnHover
		openDelay={200}
		closeDelay={100}
		class="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs transition-colors"
	>
		{@render children?.()}
	</Popover.Trigger>
	<Popover.Portal>
		<Popover.Content
			side="top"
			sideOffset={6}
			class="border-border bg-popover text-popover-foreground z-50 w-max max-w-xs rounded-md border px-3 py-1.5 text-xs shadow-md"
		>
			{hint}
			<Popover.Arrow class="text-popover" />
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
