<script lang="ts">
	import { cn } from '$lib/utils.js';

	let { cover, class: className }: { cover?: string | null; class?: string } = $props();
</script>

{#if cover?.startsWith('var(')}
	<div class={cn('bg-(--course-cover) h-28 w-full', className)} style:--course-cover={cover}></div>
{:else if cover}
	<img src={cover} alt="" class={cn('h-28 w-full object-cover', className)} />
{:else}
	<div class={cn('bg-muted h-28 w-full', className)}></div>
{/if}
