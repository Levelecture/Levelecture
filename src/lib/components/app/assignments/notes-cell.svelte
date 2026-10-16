<script lang="ts">
	import { Popover } from 'bits-ui';
	import { untrack } from 'svelte';

	let {
		value = null,
		onchange
	}: {
		value?: string | null;
		onchange?: (value: string) => void;
	} = $props();

	let local = $state(untrack(() => value ?? ''));
	let textarea = $state<HTMLTextAreaElement | null>(null);

	function handleOpenChange(next: boolean) {
		if (!next && local !== (value ?? '')) onchange?.(local);
	}
</script>

<Popover.Root onOpenChange={handleOpenChange}>
	<Popover.Trigger>
		{#snippet child({ props })}
			<input
				{...props}
				type="text"
				readonly
				value={local}
				placeholder="Empty"
				class="placeholder:text-muted-foreground/40 w-full bg-transparent px-3 py-2 text-sm outline-none"
			/>
		{/snippet}
	</Popover.Trigger>
	<Popover.Portal>
		<Popover.Content
			class="border-border bg-background z-50 w-80 max-w-[80vw] rounded-tr-md rounded-b-md border shadow-md"
			side="bottom"
			align="start"
			sideOffset={-36}
			avoidCollisions={false}
			onOpenAutoFocus={(event) => {
				event.preventDefault();
				textarea?.focus();
			}}
		>
			<textarea
				bind:this={textarea}
				value={local}
				rows={5}
				placeholder="Empty"
				oninput={(event) => (local = event.currentTarget.value)}
				class="placeholder:text-muted-foreground/40 max-h-64 min-h-24 w-full resize-none bg-transparent px-3 py-2 text-sm outline-none"
			></textarea>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
