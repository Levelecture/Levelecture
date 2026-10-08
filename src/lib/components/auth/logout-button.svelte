<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import { authClient } from '$lib/auth.js';
	import Button from '$components/ui/button/button.svelte';

	let isPending = $state(false);

	async function handleLogout() {
		isPending = true;
		try {
			const { error } = await authClient.signOut();
			if (error) throw error;
			goto(resolve('/login'));
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Gagal keluar');
			isPending = false;
		}
	}
</script>

<Button variant="outline" loading={isPending} loadingText="Keluar…" onclick={handleLogout}>
	<LogOutIcon class="size-4" />
	Keluar
</Button>
