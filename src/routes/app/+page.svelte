<script lang="ts">
	import { authClient } from '$lib/auth.js';
	import * as Avatar from '$components/ui/avatar/index.js';
	import Button from '$components/ui/button/button.svelte';
	import LogoutButton from '$components/auth/logout-button.svelte';
	import Course from '$components/app/courses/course.svelte';

	const session = authClient.useSession();
</script>

<main class="mx-auto w-full px-4 md:px-8 2xl:px-11">
	<header>
		Halo, {$session.data?.user.name}!
	</header>

	<div class="border-border mt-12 grid w-full grid-cols-[1fr_auto] rounded-md border p-4">
		<div class="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
			<Avatar.Root size="lg">
				<Avatar.Image src={$session.data?.user.image} alt={$session.data?.user.name} />
				<Avatar.Fallback>{$session.data?.user.name.charAt(0) ?? '?'}</Avatar.Fallback>
			</Avatar.Root>
			<span>S2 Budidaya Sawit</span>
		</div>
		<div class="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
			<Button href="/profile">Profile</Button>
			<LogoutButton />
		</div>
	</div>

	<Course />
</main>
