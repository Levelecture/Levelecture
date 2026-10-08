<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { authClient } from '$lib/auth.js';

	let { children } = $props();

	const session = authClient.useSession();

	$effect(() => {
		if (!$session.isPending && !$session.data) goto(resolve('/login'));
	});
</script>

{#if $session.data}
	{@render children()}
{:else}
	<div class="flex min-h-svh items-center justify-center">
		<Loader2Icon class="text-muted-foreground size-5 animate-spin" />
	</div>
{/if}
