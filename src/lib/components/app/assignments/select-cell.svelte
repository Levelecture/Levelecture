<script lang="ts">
	import { untrack } from 'svelte';
	import { Select } from 'bits-ui';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { cn } from '$lib/utils.js';

	type Item = { value: string; label: string; color?: string };

	let {
		value = '',
		items = [],
		placeholder = 'Empty',
		onchange
	}: {
		value?: string | null;
		items?: Item[];
		placeholder?: string;
		onchange?: (value: string) => void;
	} = $props();

	let local = $state(untrack(() => value ?? ''));

	const selectedItem = $derived(items.find((item) => item.value === local));
</script>

<Select.Root
	type="single"
	value={local}
	{items}
	onValueChange={(next) => {
		local = next;
		onchange?.(next);
	}}
>
	<Select.Trigger
		class="focus:ring-ring flex w-full items-center gap-1 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-inset"
	>
		{#if selectedItem && selectedItem.value}
			{#if selectedItem.color}
				<span
					class="badge-tint text-(--badge-fg) inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
					style="--badge-fg: {selectedItem.color}"
				>
					{selectedItem.label}
				</span>
			{:else}
				<span class="truncate">{selectedItem.label}</span>
			{/if}
		{:else}
			<span class="text-muted-foreground/40 truncate">{placeholder}</span>
		{/if}
		<ChevronDownIcon class="text-muted-foreground ml-auto size-3.5 shrink-0" />
	</Select.Trigger>
	<Select.Portal>
		<Select.Content
			class="border-border bg-background z-60 max-h-64 min-w-(--bits-select-anchor-width) rounded-md border p-1 shadow-md"
			sideOffset={4}
		>
			<Select.Viewport>
				{#each items as item (item.value)}
					<Select.Item
						value={item.value}
						label={item.label}
						class="data-highlighted:bg-muted flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none"
					>
						{#snippet children({ selected })}
							{item.label}
							{#if selected}<CheckIcon class="ml-auto size-3.5" />{/if}
						{/snippet}
					</Select.Item>
				{/each}
			</Select.Viewport>
		</Select.Content>
	</Select.Portal>
</Select.Root>
