<script lang="ts">
	import { untrack } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		value = '',
		type = 'text',
		placeholder = 'Empty',
		min,
		max,
		step,
		locked = false,
		class: className,
		onchange,
		onblocked
	}: {
		value?: string | number | null;
		type?: 'text' | 'number';
		placeholder?: string;
		min?: string;
		max?: string;
		step?: string;
		locked?: boolean;
		class?: string;
		onchange?: (value: string) => void;
		onblocked?: () => void;
	} = $props();

	let local = $state(untrack(() => (value == null ? '' : String(value))));

	function commit() {
		if (locked) return;
		const current = value == null ? '' : String(value);
		if (local !== current) onchange?.(local);
	}
</script>

<input
	{type}
	{placeholder}
	{min}
	{max}
	{step}
	readonly={locked}
	value={local}
	onpointerdown={() => {
		if (locked) onblocked?.();
	}}
	oninput={(event) => {
		if (locked) return;
		local = event.currentTarget.value;
		onchange?.(local);
	}}
	onblur={commit}
	onkeydown={(event) => {
		if (event.key === 'Enter') event.currentTarget.blur();
	}}
	class={cn(
		'focus:ring-ring w-full bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-inset [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
		locked && 'text-muted-foreground/50 cursor-pointer',
		className
	)}
/>
