<script lang="ts">
	import { untrack } from 'svelte';
	import { Popover, Calendar, TimeField, type TimeValue } from 'bits-ui';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import {
		CalendarDate,
		CalendarDateTime,
		today,
		getLocalTimeZone,
		type DateValue
	} from '@internationalized/date';
	import { cn } from '$lib/utils.js';

	let {
		value = null,
		onchange
	}: {
		value?: string | null;
		onchange?: (iso: string) => void;
	} = $props();

	let open = $state(false);
	let current = $state<CalendarDateTime | undefined>(untrack(() => fromIso(value)));

	const todayDay = today(getLocalTimeZone());
	const selectedDay = $derived(
		current ? new CalendarDate(current.year, current.month, current.day) : undefined
	);

	const labelFmt = new Intl.DateTimeFormat('id-ID', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit'
	});
	const label = $derived(current ? labelFmt.format(toDate(current)) : '');

	function toDate(dt: CalendarDateTime): Date {
		return new Date(dt.year, dt.month - 1, dt.day, dt.hour, dt.minute);
	}

	function fromIso(iso: string | null): CalendarDateTime | undefined {
		if (!iso) return undefined;
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) return undefined;
		return new CalendarDateTime(
			date.getFullYear(),
			date.getMonth() + 1,
			date.getDate(),
			date.getHours(),
			date.getMinutes()
		);
	}

	function toIso(dt: CalendarDateTime): string {
		return toDate(dt).toISOString();
	}

	function defaultDateTime(): CalendarDateTime {
		const day = today(getLocalTimeZone());
		return new CalendarDateTime(day.year, day.month, day.day, 0, 0);
	}

	function cellRangeClass(date: DateValue): string {
		if (!selectedDay) return '';
		const future = todayDay.compare(selectedDay) <= 0;
		const start = future ? todayDay : selectedDay;
		const end = future ? selectedDay : todayDay;
		if (date.compare(start) < 0 || date.compare(end) > 0) return '';
		if (start.compare(end) === 0) return '';
		let classes = 'bg-muted';
		if (date.compare(start) === 0) classes += ' rounded-l-md';
		if (date.compare(end) === 0) classes += ' rounded-r-md';
		return classes;
	}

	function handleDateChange(next: DateValue | DateValue[] | undefined) {
		if (!next || Array.isArray(next)) return;
		const base = current ?? defaultDateTime();
		current = new CalendarDateTime(next.year, next.month, next.day, base.hour, base.minute);
		onchange?.(toIso(current));
	}

	function handleTimeChange(next: TimeValue | TimeValue[] | undefined) {
		if (!next || Array.isArray(next)) return;
		const base = current ?? defaultDateTime();
		current = new CalendarDateTime(base.year, base.month, base.day, next.hour, next.minute);
		onchange?.(toIso(current));
	}

	function clear() {
		current = undefined;
		onchange?.('');
		open = false;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		class="hover:bg-muted flex w-full items-center rounded px-3 py-2 text-left text-sm transition-colors"
	>
		{#if label}
			<span class="truncate">{label}</span>
		{:else}
			<span class="text-muted-foreground/50">Atur tenggat</span>
		{/if}
	</Popover.Trigger>

	<Popover.Portal>
		<Popover.Content
			class="border-border bg-popover text-popover-foreground z-60 rounded-md border p-3 shadow-md"
			sideOffset={4}
		>
			<Calendar.Root
				type="single"
				value={selectedDay}
				locale="id-ID"
				weekdayFormat="short"
				fixedWeeks
				preventDeselect
				onValueChange={handleDateChange}
			>
				{#snippet children({ months, weekdays })}
					<Calendar.Header class="flex items-center justify-between">
						<Calendar.PrevButton
							class="hover:bg-muted inline-flex size-7 items-center justify-center rounded-md transition-colors"
						>
							<ChevronLeftIcon class="size-4" />
						</Calendar.PrevButton>
						<Calendar.Heading class="text-sm font-medium" />
						<Calendar.NextButton
							class="hover:bg-muted inline-flex size-7 items-center justify-center rounded-md transition-colors"
						>
							<ChevronRightIcon class="size-4" />
						</Calendar.NextButton>
					</Calendar.Header>

					{#each months as month (month.value)}
						<Calendar.Grid class="mt-3 w-full border-collapse select-none">
							<Calendar.GridHead>
								<Calendar.GridRow class="flex w-full">
									{#each weekdays as day (day)}
										<Calendar.HeadCell class="text-muted-foreground flex-1 text-center text-xs font-normal">
											{day.slice(0, 2)}
										</Calendar.HeadCell>
									{/each}
								</Calendar.GridRow>
							</Calendar.GridHead>
							<Calendar.GridBody>
								{#each month.weeks as weekDates (weekDates)}
									<Calendar.GridRow class="flex w-full">
										{#each weekDates as date (date)}
											<Calendar.Cell
												{date}
												month={month.value}
												class={cn('flex-1 p-0', cellRangeClass(date))}
											>
												<Calendar.Day
													class="group hover:bg-muted data-selected:bg-primary data-selected:text-primary-foreground data-outside-month:pointer-events-none data-outside-month:text-muted-foreground/40 data-disabled:pointer-events-none data-disabled:text-muted-foreground/30 relative mx-auto flex size-8 items-center justify-center rounded-md text-sm transition-colors"
												>
													<span
														class="bg-primary group-data-selected:bg-primary-foreground absolute bottom-0.5 hidden size-1 rounded-full group-data-today:block"
													></span>
													{date.day}
												</Calendar.Day>
											</Calendar.Cell>
										{/each}
									</Calendar.GridRow>
								{/each}
							</Calendar.GridBody>
						</Calendar.Grid>
					{/each}
				{/snippet}
			</Calendar.Root>

			<div class="border-border mt-3 flex items-center gap-2 border-t pt-3">
				<TimeField.Root
					value={current}
					granularity="minute"
					locale="id-ID"
					onValueChange={handleTimeChange}
				>
					<TimeField.Input class="text-foreground flex items-center text-sm">
						{#snippet children({ segments })}
							{#each segments as { part, value: segVal }, i (part + i)}
								{#if part === 'literal'}
									<TimeField.Segment {part} class="text-muted-foreground/60 px-0.5 select-none">
										{segVal}
									</TimeField.Segment>
								{:else}
									<TimeField.Segment
										{part}
										class="hover:bg-muted focus:bg-muted focus:text-foreground aria-[valuetext=Empty]:text-muted-foreground/40 rounded px-1 py-0.5 outline-none"
									>
										{segVal}
									</TimeField.Segment>
								{/if}
							{/each}
						{/snippet}
					</TimeField.Input>
				</TimeField.Root>

				<button
					type="button"
					class="text-muted-foreground hover:text-destructive ml-auto text-xs transition-colors"
					onclick={clear}
				>
					Hapus
				</button>
			</div>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
