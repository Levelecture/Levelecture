<script lang="ts">
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { Arc, ArcLabel, PieChart, Text } from 'layerchart';

	import * as Chart from '$components/ui/chart/index.js';
	import Button from '$components/ui/button/button.svelte';
	import { getAssignmentStatusChart } from '$lib/api/charts/index.js';
	import {
		label,
		resetStatusDeltas,
		statusColors,
		statusDeltas
	} from '$lib/assignments-revision.svelte.js';
	import { assignmentStatus } from '$lib/types/assignments.js';
	import type { AssignmentStatusChart } from '$lib/types/charts.js';

	const chartConfig = {
		todo: { label: label('todo'), color: statusColors.todo },
		in_progress: { label: label('in_progress'), color: statusColors.in_progress },
		done: { label: label('done'), color: statusColors.done }
	} satisfies Chart.ChartConfig;

	let statusCounts = $state.raw<AssignmentStatusChart | null>(null);
	let error = $state<string | null>(null);

	async function load() {
		error = null;
		try {
			statusCounts = await getAssignmentStatusChart();
			resetStatusDeltas();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Gagal memuat distribusi status';
		}
	}

	$effect(() => {
		void load();
	});

	const chartData = $derived(
		assignmentStatus.map((status) => ({
			key: status,
			label: chartConfig[status].label,
			value: (statusCounts?.[status] ?? 0) + statusDeltas()[status],
			fill: statusColors[status]
		}))
	);
	const total = $derived(chartData.reduce((sum, item) => sum + item.value, 0));
</script>

{#if error}
	<div class="flex flex-col items-center gap-3 py-12 text-center">
		<p class="text-muted-foreground text-sm">{error}</p>
		<Button variant="outline" onclick={() => void load()}>Coba lagi</Button>
	</div>
{:else if statusCounts === null}
	<div class="text-muted-foreground flex h-64 items-center justify-center gap-2 text-sm">
		<Loader2Icon class="size-4 animate-spin" />
		Memuat distribusi…
	</div>
{:else if total === 0}
	<div class="text-muted-foreground flex h-64 items-center justify-center text-sm">
		Belum ada tugas.
	</div>
{:else}
	<Chart.Container
		config={chartConfig}
		class="mx-auto aspect-square max-h-105 w-full max-w-105"
	>
		<PieChart
			data={chartData.filter((item) => item.value > 0)}
			key="key"
			label="label"
			value="value"
			c="fill"
			innerRadius={0.75}
			padding={{ top: 24, bottom: 24, left: 90, right: 90 }}
		>
			{#snippet arc({ props })}
				<Arc {...props}>
					{#snippet children({
						centroid,
						startAngle,
						endAngle,
						innerRadius,
						outerRadius,
						getArcTextProps
					})}
						<ArcLabel
							{centroid}
							{startAngle}
							{endAngle}
							{innerRadius}
							{outerRadius}
							{getArcTextProps}
							placement="callout"
							calloutLineLength={20}
							calloutLabelOffset={16}
							value={props.data.label}
							fontSize={12}
							class="fill-foreground! text-xs"
							line={{
								stroke: 'var(--muted-foreground)',
								class: 'stroke-muted-foreground!'
							}}
						/>
					{/snippet}
				</Arc>
			{/snippet}
			{#snippet aboveMarks()}
				<Text
					value={String(total)}
					textAnchor="middle"
					verticalAnchor="middle"
					fontSize={24}
					class="fill-foreground text-2xl!"
					dy={-8}
				/>
				<Text
					value="Total Tugas"
					textAnchor="middle"
					verticalAnchor="middle"
					fontSize={10}
					class="fill-muted-foreground text-[10px]!"
					dy={10}
				/>
			{/snippet}
			{#snippet tooltip()}
				<Chart.Tooltip hideLabel />
			{/snippet}
		</PieChart>
	</Chart.Container>
{/if}
