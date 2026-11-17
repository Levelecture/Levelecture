<script lang="ts">
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import StarIcon from '@lucide/svelte/icons/star';
	import { BarChart, defaultChartPadding } from 'layerchart';
	import { scaleThreshold } from 'd3-scale';

	import * as Chart from '$components/ui/chart/index.js';
	import Button from '$components/ui/button/button.svelte';
	import { getAssignmentGradesChart } from '$lib/api/charts/index.js';
	import { getGradePoints, seedGradePoints } from '$lib/assignments-revision.svelte.js';

	const barChartConfig = {
		grade: { label: 'Nilai' }
	} satisfies Chart.ChartConfig;

	let error = $state<string | null>(null);

	async function load() {
		error = null;
		try {
			seedGradePoints(await getAssignmentGradesChart());
		} catch (err) {
			error = err instanceof Error ? err.message : 'Gagal memuat daftar nilai';
		}
	}

	$effect(() => {
		void load();
	});

	const points = $derived(getGradePoints());
	const chartKey = $derived(
		(points ?? []).map((point) => `${point.id}:${point.title}`).join('|')
	);
	const barHeight = $derived(Math.max(160, (points?.length ?? 0) * 32));
</script>

<section class="mt-10">
	<div class="flex items-center gap-2">
		<StarIcon class="text-muted-foreground size-4" />
		<h2 class="text-sm font-medium">Daftar Nilai Tugas</h2>
	</div>

	{#if error}
		<div class="flex flex-col items-center gap-3 py-12 text-center">
			<p class="text-muted-foreground text-sm">{error}</p>
			<Button variant="outline" onclick={() => void load()}>Coba lagi</Button>
		</div>
	{:else if points === null}
		<div class="text-muted-foreground flex h-64 items-center justify-center gap-2 text-sm">
			<Loader2Icon class="size-4 animate-spin" />
			Memuat daftar nilai…
		</div>
	{:else if points.length === 0}
		<div class="text-muted-foreground flex h-64 items-center justify-center text-sm">
			Belum ada tugas yang dinilai.
		</div>
	{:else}
		{#key chartKey}
			<Chart.Container config={barChartConfig} class="mt-4 aspect-auto w-full">
				<BarChart
					data={points}
					x="grade"
					y="title"
					orientation="horizontal"
					xDomain={[0, 100]}
					bandPadding={0.25}
					axis="y"
					rule={false}
					c="grade"
					cScale={scaleThreshold()}
					cDomain={[60, 80]}
					cRange={[
						'var(--course-cover-red)',
						'var(--course-cover-yellow)',
						'var(--course-cover-green)'
					]}
					series={[{ key: 'grade', label: barChartConfig.grade.label }]}
					props={{ bars: { stroke: 'none' } }}
					padding={defaultChartPadding({ right: 32 })}
					height={barHeight}
				>
					{#snippet tooltip()}
						<Chart.Tooltip hideLabel />
					{/snippet}
				</BarChart>
			</Chart.Container>
		{/key}
	{/if}
</section>
