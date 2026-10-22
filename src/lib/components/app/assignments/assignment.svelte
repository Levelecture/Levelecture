<script lang="ts">
	import { onMount, onDestroy, untrack, type Component } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { toast } from 'svelte-sonner';
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Checkbox } from 'bits-ui';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import CheckIcon from '@lucide/svelte/icons/check';
	import InfoIcon from '@lucide/svelte/icons/info';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import TypeIcon from '@lucide/svelte/icons/type';
	import AlignLeftIcon from '@lucide/svelte/icons/align-left';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import CircleDotIcon from '@lucide/svelte/icons/circle-dot';
	import FlagIcon from '@lucide/svelte/icons/flag';
	import LinkIcon from '@lucide/svelte/icons/link';
	import StarIcon from '@lucide/svelte/icons/star';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import {
		createTable,
		tableFeatures,
		rowSelectionFeature,
		type ColumnDef
	} from '@tanstack/svelte-table';

	import * as Table from '$components/ui/table/index.js';
	import Button from '$components/ui/button/button.svelte';
	import TextCell from '$components/app/assignments/text-cell.svelte';
	import LinkCell from '$components/app/assignments/link-cell.svelte';
	import NotesCell from '$components/app/assignments/notes-cell.svelte';
	import SelectCell from '$components/app/assignments/select-cell.svelte';
	import DeadlineCell from '$components/app/assignments/deadline-cell.svelte';
	import HoldButton from '$components/app/assignments/hold-button.svelte';
	import HintPopover from '$components/app/assignments/hint-popover.svelte';

	import {
		listAssignments,
		createAssignment,
		updateAssignment,
		deleteAssignment
	} from '$lib/api/assignments/index.js';
	import { listCourses } from '$lib/api/courses/index.js';
	import { adjustStatusCount, label, statusColors } from '$lib/assignments-revision.svelte.js';
	import {
		assignmentStatus,
		assignmentPriority,
		createAssignmentSchema,
		type Assignment,
		type AssignmentPriority,
		type AssignmentStatus,
		type ListAssignmentsQuery,
		type UpdateAssignmentInput
	} from '$lib/types/assignments.js';
	import type { Course } from '$lib/types/courses.js';
	import { cn } from '$lib/utils.js';

	let assignments = $state.raw<Assignment[] | null>(null);
	let courses = $state.raw<Course[]>([]);
	let error = $state<string | null>(null);

	const pending = new SvelteSet<string>();
	const debounceTimers = new SvelteMap<string, ReturnType<typeof setTimeout>>();
	const resetVersion = new SvelteMap<string, number>();
	const flashing = new SvelteSet<string>();
	const flashTimers = new SvelteMap<string, ReturnType<typeof setTimeout>>();
	const latestReq = new SvelteMap<string, number>();
	let reqSeq = 0;

	const params = untrack(() => page.url.searchParams);

	function param<T extends string>(key: string, allowed: readonly T[]): T | 'all' {
		const value = params.get(key);
		return value && (allowed as readonly string[]).includes(value) ? (value as T) : 'all';
	}

	let loading = $state(false);
	let loadSeq = 0;
	let filterStatus = $state<AssignmentStatus | 'all'>(param('status', assignmentStatus));
	let filterPriority = $state<AssignmentPriority | 'all'>(param('priority', assignmentPriority));
	let filterReset = $state(0);

	const SEARCH_DEBOUNCE_MS = 600;
	const initialSearch = params.get('search')?.trim() ?? '';
	let search = $state(initialSearch);
	let searchInput = $state(initialSearch);
	let searchTimer: ReturnType<typeof setTimeout> | undefined;

	const features = tableFeatures({ rowSelectionFeature });

	const columns: ColumnDef<typeof features, Assignment>[] = [
		{ id: 'select' },
		{ id: 'courseId' },
		{ id: 'title' },
		{ id: 'notes' },
		{ id: 'dueAt' },
		{ id: 'status' },
		{ id: 'priority' },
		{ id: 'taskUrl' },
		{ id: 'grade' }
	];

	const table = createTable({
		features,
		columns,
		get data() {
			return assignments ?? [];
		},
		getRowId: (row) => row.id
	});

	const selectedCount = $derived(Object.keys(table.atoms.rowSelection.get()).length);

	const columnClassMap: Record<string, string> = {
		select: 'w-10',
		courseId: 'min-w-[160px]',
		title: 'min-w-[220px]',
		notes: 'min-w-[180px]',
		dueAt: 'min-w-[190px]',
		status: 'min-w-[150px]',
		priority: 'min-w-[140px]',
		taskUrl: 'min-w-[200px]',
		grade: 'min-w-[110px]'
	};

	const columnMeta: Record<string, { label: string; hint: string; icon: Component }> = {
		courseId: {
			icon: BookOpenIcon,
			label: 'Mata Kuliah',
			hint: 'Mata kuliah yang memiliki tugas ini.'
		},
		title: { icon: TypeIcon, label: 'Nama Tugas', hint: 'Judul singkat.' },
		notes: {
			icon: AlignLeftIcon,
			label: 'Catatan',
			hint: 'Detail bebas: materi, halaman, atau instruksi khusus.'
		},
		dueAt: {
			icon: CalendarIcon,
			label: 'Deadline',
			hint: 'Batas waktu pengumpulan.'
		},
		status: { icon: CircleDotIcon, label: 'Status', hint: 'Sejauh mana tugas ini dikerjakan.' },
		priority: {
			icon: FlagIcon,
			label: 'Prioritas',
			hint: 'Seberapa mendesak tugas ini.'
		},
		taskUrl: {
			icon: LinkIcon,
			label: 'Link Tugas',
			hint: 'Tautan referensi atau tempat mengumpulkan tugas.'
		},
		grade: {
			icon: StarIcon,
			label: 'Nilai',
			hint: 'Nilai 0–100. Baru bisa diisi setelah status Done.'
		}
	};

	const courseItems = $derived(courses.map((course) => ({ value: course.id, label: course.name })));
	const priorityColors: Record<AssignmentPriority, string> = {
		low: 'var(--course-cover-teal)',
		medium: 'var(--course-cover-yellow)',
		high: 'var(--course-cover-orange)',
		urgent: 'var(--course-cover-red)'
	};

	const statusItems = assignmentStatus.map((status) => ({
		value: status,
		label: label(status),
		color: statusColors[status]
	}));
	const priorityItems = [
		{ value: '', label: 'Empty' },
		...assignmentPriority.map((priority) => ({
			value: priority,
			label: label(priority),
			color: priorityColors[priority]
		}))
	];
	const statusFilterItems = [{ value: 'all', label: 'Semua status' }, ...statusItems];
	const priorityFilterItems = [
		{ value: 'all', label: 'Semua prioritas' },
		...priorityItems.filter((item) => item.value)
	];

	function rows(): Assignment[] {
		return assignments ?? [];
	}

	function toGrade(raw: string): number | null {
		if (raw.trim() === '') return null;
		const parsed = Number(raw);
		return Number.isFinite(parsed) ? parsed : null;
	}

	async function load() {
		error = null;
		loading = true;
		const seq = ++loadSeq;
		const query: ListAssignmentsQuery = {};
		if (filterStatus !== 'all') query.status = filterStatus;
		if (filterPriority !== 'all') query.priority = filterPriority;
		if (search) query.search = search;
		try {
			const data = await listAssignments(query);
			if (seq === loadSeq) assignments = data;
		} catch (err) {
			if (seq === loadSeq) error = err instanceof Error ? err.message : 'Gagal memuat tugas';
		} finally {
			if (seq === loadSeq) loading = false;
		}
	}

	$effect(() => {
		void load();
	});

	function cancelLoad() {
		loadSeq++;
		loading = false;
	}

	function setParam(url: URL, key: string, value: string) {
		if (value && value !== 'all') url.searchParams.set(key, value);
		else url.searchParams.delete(key);
	}

	$effect(() => {
		const current = untrack(() => page.url);
		const url = new URL(current.href);
		setParam(url, 'status', filterStatus);
		setParam(url, 'priority', filterPriority);
		setParam(url, 'search', search);
		if (url.href === current.href) return;
		const state = untrack(() => page.state);
		const query = url.searchParams.toString();
		if (query) {
			const target: `/app?${string}` = `/app?${query}`;
			replaceState(resolve(target), state);
		} else {
			replaceState(resolve('/app'), state);
		}
	});

	onMount(() => {
		listCourses()
			.then((list) => (courses = list))
			.catch(() => {});
	});

	onDestroy(() => {
		clearTimeout(searchTimer);
		for (const timer of debounceTimers.values()) clearTimeout(timer);
		debounceTimers.clear();
		for (const timer of flashTimers.values()) clearTimeout(timer);
		flashTimers.clear();
	});

	function resetKey(id: string, field: string): string {
		const key = `${id}:${field}`;
		return `${key}:${resetVersion.get(key) ?? 0}`;
	}

	function isFlashing(id: string, field: string): boolean {
		return flashing.has(`${id}:${field}`);
	}

	function flashCell(key: string) {
		flashing.add(key);
		const timer = flashTimers.get(key);
		if (timer) clearTimeout(timer);
		flashTimers.set(
			key,
			setTimeout(() => {
				flashing.delete(key);
				flashTimers.delete(key);
			}, 1200)
		);
	}

	async function persist(
		id: string,
		patch: UpdateAssignmentInput,
		key: string,
		current: Assignment | undefined
	) {
		if (!current) return;
		const changed = Object.entries(patch).some(([field, value]) => {
			const stored = (current as Record<string, unknown>)[field];
			return value instanceof Date ? stored !== value.toISOString() : stored !== value;
		});
		if (!changed) return;

		const seq = ++reqSeq;
		latestReq.set(key, seq);
		pending.add(id);
		try {
			const saved = await updateAssignment(id, patch);
			if (latestReq.get(key) === seq) {
				cancelLoad();
				assignments = rows().map((row) => (row.id === id ? saved : row));
			}
		} catch (err) {
			if (latestReq.get(key) === seq) {
				if ('status' in patch) {
					adjustStatusCount(current.status, 1);
					adjustStatusCount(patch.status as AssignmentStatus, -1);
				}
				toast.error(err instanceof Error ? err.message : 'Gagal menyimpan perubahan');
				resetVersion.set(key, (resetVersion.get(key) ?? 0) + 1);
				flashCell(key);
			}
		} finally {
			pending.delete(id);
		}
	}

	function saveNow(id: string, patch: UpdateAssignmentInput) {
		const key = `${id}:${Object.keys(patch).join(',')}`;
		void persist(id, patch, key, rows().find((row) => row.id === id));
	}

	function save(id: string, patch: UpdateAssignmentInput, delay: number) {
		const key = `${id}:${Object.keys(patch).join(',')}`;
		const current = rows().find((row) => row.id === id);
		const timer = debounceTimers.get(key);
		if (timer) clearTimeout(timer);
		debounceTimers.set(
			key,
			setTimeout(() => {
				debounceTimers.delete(key);
				void persist(id, patch, key, current);
			}, delay)
		);
	}

	let showDraft = $state(false);
	let draftCourseId = $state('');
	let draftTitle = $state('');
	let draftNotes = $state('');
	let draftTaskUrl = $state('');
	let draftStatus = $state<AssignmentStatus>('todo');
	let draftPriority = $state<AssignmentPriority | ''>('');
	let draftDueAt = $state('');
	let draftRowEl = $state<HTMLTableRowElement | null>(null);

	function autofocus(node: HTMLInputElement) {
		node.focus();
	}

	function resetDraft() {
		draftCourseId = '';
		draftTitle = '';
		draftNotes = '';
		draftTaskUrl = '';
		draftStatus = 'todo';
		draftPriority = '';
		draftDueAt = '';
	}

	function cancelDraft() {
		showDraft = false;
		resetDraft();
	}

	function addDraft() {
		filterReset++;
		filterStatus = 'all';
		filterPriority = 'all';
		clearSearch();
		showDraft = true;
	}

	function onSearch(value: string) {
		searchInput = value;
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			table.setRowSelection({});
			search = searchInput.trim();
		}, SEARCH_DEBOUNCE_MS);
	}

	function clearSearch() {
		clearTimeout(searchTimer);
		table.setRowSelection({});
		searchInput = '';
		search = '';
	}

	function handleOutsidePointer(event: PointerEvent) {
		if (!showDraft) return;
		const target = event.target as HTMLElement | null;
		if (!target || draftRowEl?.contains(target)) return;
		if (target.closest('[data-popover-content],[data-select-content],[role="listbox"],[role="dialog"]'))
			return;
		if (draftTitle.trim() && draftCourseId) createDraft();
		else cancelDraft();
	}

	async function createDraft() {
		if (pending.has('draft')) return;
		const parsed = createAssignmentSchema.safeParse({
			courseId: draftCourseId,
			title: draftTitle.trim(),
			notes: draftNotes.trim() || undefined,
			taskUrl: draftTaskUrl.trim() || undefined,
			status: draftStatus,
			priority: draftPriority || undefined,
			dueAt: draftDueAt || undefined
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? 'Data tidak valid');
			return;
		}

		pending.add('draft');
		adjustStatusCount(draftStatus, 1);
		try {
			const saved = await createAssignment(parsed.data);
			if (filterStatus !== 'all' || filterPriority !== 'all' || search) {
				await load();
			} else {
				cancelLoad();
				assignments = [saved, ...rows()];
			}
			resetDraft();
			showDraft = false;
		} catch (err) {
			adjustStatusCount(draftStatus, -1);
			toast.error(err instanceof Error ? err.message : 'Gagal menambahkan tugas');
		} finally {
			pending.delete('draft');
		}
	}

	async function deleteSelected() {
		const ids = Object.keys(table.atoms.rowSelection.get());
		if (!ids.length) return;

		table.setRowSelection({});
		ids.forEach((id) => pending.add(id));
		const statusById = new Map<string, AssignmentStatus>(
			rows().filter((row) => ids.includes(row.id)).map((row) => [row.id, row.status])
		);
		for (const status of statusById.values()) adjustStatusCount(status, -1);

		const results = await Promise.allSettled(ids.map((id) => deleteAssignment(id)));
		ids.forEach((id, index) => {
			const status = statusById.get(id);
			if (status && results[index].status === 'rejected') adjustStatusCount(status, 1);
		});
		const deleted = new Set(ids.filter((_, index) => results[index].status === 'fulfilled'));

		cancelLoad();
		assignments = rows().filter((row) => !deleted.has(row.id));
		ids.forEach((id) => pending.delete(id));

		const failed = ids.length - deleted.size;
		if (failed) toast.error(`${failed} tugas gagal dihapus`);
		if (deleted.size) toast.success(`${deleted.size} tugas dihapus`);
	}
</script>

<svelte:window onpointerdown={handleOutsidePointer} />

{#snippet columnHead(id: string)}
	{@const meta = columnMeta[id]}
	{#if meta}
		{@const Icon = meta.icon}
		<HintPopover hint={meta.hint}>
			<Icon class="size-3.5" />
			{meta.label}
			<InfoIcon class="size-3 opacity-60" />
		</HintPopover>
	{/if}
{/snippet}

<section>
	<div class="flex flex-wrap items-end justify-between gap-2">
		<div class="flex flex-col items-start gap-2">
			<div class="flex items-center gap-2 rounded-md px-3 py-1.5">
				<ClipboardListIcon class="size-4" />
				<span class="text-sm font-semibold">Tugas</span>
				{#if pending.size > 0 || loading}
					<Loader2Icon class="text-muted-foreground size-3.5 animate-spin" />
				{/if}
			</div>
			<div class="border-border flex w-45 items-center gap-1.5 rounded-md border px-2.5 py-2">
				<SearchIcon class="text-muted-foreground size-3.5 shrink-0" />
				<input
					value={searchInput}
					oninput={(event) => onSearch(event.currentTarget.value)}
					placeholder="Cari tugas..."
					aria-label="Cari tugas"
					class="placeholder:text-muted-foreground/40 w-full min-w-0 bg-transparent text-sm outline-none"
				/>
				{#if searchInput}
					<button
						type="button"
						onclick={clearSearch}
						aria-label="Bersihkan pencarian"
						class="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
					>
						<XIcon class="size-3.5" />
					</button>
				{/if}
			</div>
		</div>
		<div class="flex shrink-0 items-center gap-2">
			{#if selectedCount > 0}
				<HoldButton oncomplete={deleteSelected}>Hapus ({selectedCount})</HoldButton>
			{/if}
			{#key filterReset}
				<div class="border-border w-37.5 rounded-md border">
					<SelectCell
						value={filterStatus}
						items={statusFilterItems}
						onchange={(value) => {
							table.setRowSelection({});
							filterStatus = value as AssignmentStatus | 'all';
						}}
					/>
				</div>
				<div class="border-border w-37.5 rounded-md border">
					<SelectCell
						value={filterPriority}
						items={priorityFilterItems}
						onchange={(value) => {
							table.setRowSelection({});
							filterPriority = value as AssignmentPriority | 'all';
						}}
					/>
				</div>
			{/key}
		</div>
	</div>

	<div class="border-border mt-3 overflow-x-auto rounded-md border">
		{#if error}
			<div class="flex flex-col items-center gap-3 p-8 text-center">
				<p class="text-muted-foreground text-sm">{error}</p>
				<Button variant="outline" size="sm" onclick={load}>Coba lagi</Button>
			</div>
		{:else if assignments === null}
			<div class="flex flex-col gap-2 p-4">
				{#each [0, 1, 2, 3] as i (i)}
					<div class="bg-muted h-6 animate-pulse rounded"></div>
				{/each}
			</div>
		{:else}
			<Table.Root>
				<Table.Header>
					{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
						<Table.Row class="hover:bg-transparent">
							{#each headerGroup.headers as header (header.id)}
								<Table.Head class={cn('text-muted-foreground text-xs', columnClassMap[header.column.id])}>
									{#if header.column.id === 'select'}
										<Checkbox.Root
											checked={table.getIsAllRowsSelected()}
											onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
											aria-label="Pilih semua tugas"
											class="border-border bg-background focus-visible:ring-ring data-[state=checked]:border-primary data-[state=checked]:bg-primary flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border outline-none focus-visible:ring-2"
										>
											{#snippet children({ checked })}
												{#if checked}
													<CheckIcon class="text-primary-foreground size-2.5" />
												{/if}
											{/snippet}
										</Checkbox.Root>
									{:else}
										{@render columnHead(header.column.id)}
									{/if}
								</Table.Head>
							{/each}
						</Table.Row>
					{/each}
				</Table.Header>
				<Table.Body>
					{#each table.getRowModel().rows as row (row.id)}
						<Table.Row>
							{#each row.getAllCells() as cell (cell.id)}
								<Table.Cell
									class={cn(
										'p-0 align-middle',
										columnClassMap[cell.column.id],
										isFlashing(row.original.id, cell.column.id) &&
											'bg-destructive/10 transition-colors'
									)}
								>
									{#if cell.column.id === 'select'}
										<div class="px-3 py-2">
											<Checkbox.Root
												checked={row.getIsSelected()}
												onCheckedChange={(value) => row.toggleSelected(!!value)}
												aria-label="Pilih tugas"
												class="border-border bg-background focus-visible:ring-ring data-[state=checked]:border-primary data-[state=checked]:bg-primary flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border outline-none focus-visible:ring-2"
											>
												{#snippet children({ checked })}
													{#if checked}
														<CheckIcon class="text-primary-foreground size-2.5" />
													{/if}
												{/snippet}
											</Checkbox.Root>
										</div>
									{:else if cell.column.id === 'courseId'}
										{#key resetKey(row.original.id, 'courseId')}
											<SelectCell
												value={row.original.courseId}
												items={courseItems}
												placeholder="Pilih MK..."
												onchange={(value) => {
													if (value) save(row.original.id, { courseId: value }, 300);
												}}
											/>
										{/key}
									{:else if cell.column.id === 'title'}
										{#key resetKey(row.original.id, 'title')}
											<TextCell
												value={row.original.title}
												placeholder="Nama Tugas"
												class="font-medium"
												onchange={(value) => {
													const title = value.trim();
													if (title) save(row.original.id, { title }, 600);
												}}
											/>
										{/key}
									{:else if cell.column.id === 'notes'}
										{#key resetKey(row.original.id, 'notes')}
											<NotesCell
												value={row.original.notes}
												onchange={(value) =>
													saveNow(row.original.id, { notes: value || null })}
											/>
										{/key}
									{:else if cell.column.id === 'dueAt'}
										{#key resetKey(row.original.id, 'dueAt')}
											<DeadlineCell
												value={row.original.dueAt}
												onchange={(value) =>
													save(row.original.id, { dueAt: value ? new Date(value) : null }, 800)}
											/>
										{/key}
									{:else if cell.column.id === 'status'}
										{#key resetKey(row.original.id, 'status')}
											<SelectCell
												value={row.original.status}
												items={statusItems}
											onchange={(value) => {
												const next = value as AssignmentStatus;
												const id = row.original.id;
												if (
													next !== 'done' &&
													row.original.status === 'done' &&
													row.original.grade != null
												) {
													assignments = rows().map((row) =>
														row.id === id ? { ...row, grade: null } : row
													);
													const key = `${id}:grade`;
													resetVersion.set(key, (resetVersion.get(key) ?? 0) + 1);
												}
												adjustStatusCount(row.original.status, -1);
												adjustStatusCount(next, 1);
												save(id, { status: next }, 300);
											}}
											/>
										{/key}
									{:else if cell.column.id === 'priority'}
										{#key resetKey(row.original.id, 'priority')}
											<SelectCell
												value={row.original.priority}
												items={priorityItems}
												onchange={(value) =>
													save(
														row.original.id,
														{ priority: value ? (value as AssignmentPriority) : null },
														300
													)}
											/>
										{/key}
									{:else if cell.column.id === 'taskUrl'}
										{#key resetKey(row.original.id, 'taskUrl')}
											<LinkCell
												value={row.original.taskUrl}
												onchange={(value) =>
													saveNow(row.original.id, { taskUrl: value || null })}
											/>
										{/key}
									{:else if cell.column.id === 'grade'}
										{#key resetKey(row.original.id, 'grade')}
											<TextCell
												type="number"
												min="0"
												max="100"
												step="0.01"
												placeholder="–"
												locked={row.original.status !== 'done'}
												value={row.original.grade}
												onchange={(value) =>
													save(row.original.id, { grade: toGrade(value) }, 300)}
												onblocked={() => toast.error('Nilai hanya bisa diisi saat status Done')}
											/>
										{/key}
									{/if}
								</Table.Cell>
							{/each}
						</Table.Row>
					{/each}

					{#if table.getRowModel().rows.length === 0 && !showDraft}
						<Table.Row class="hover:bg-transparent">
							<Table.Cell
								colspan={columns.length}
								class="text-muted-foreground py-8 text-center text-sm"
							>
								{filterStatus !== 'all' || filterPriority !== 'all' || search
									? 'Tidak ada tugas yang cocok.'
									: 'Belum ada tugas. Klik "Tambah tugas" untuk menambahkan.'}
							</Table.Cell>
						</Table.Row>
					{/if}

					{#if showDraft}
						<Table.Row bind:ref={draftRowEl} class="hover:bg-transparent">
							<Table.Cell class="w-10" />
							<Table.Cell class="p-0">
								<SelectCell
									value={draftCourseId}
									items={courseItems}
									placeholder="Pilih MK..."
									onchange={(value) => (draftCourseId = value)}
								/>
							</Table.Cell>
							<Table.Cell class="p-0">
								<input
									{@attach autofocus}
									bind:value={draftTitle}
									placeholder="Nama Tugas"
									class="ring-ring w-full bg-transparent px-3 py-2 text-sm ring-2 ring-inset outline-none"
									onkeydown={(event) => {
										if (event.key === 'Enter' && draftCourseId) createDraft();
										if (event.key === 'Escape') cancelDraft();
									}}
								/>
							</Table.Cell>
							<Table.Cell class="p-0">
								<input
									bind:value={draftNotes}
									placeholder="Empty"
									class="placeholder:text-muted-foreground/40 w-full bg-transparent px-3 py-2 text-sm outline-none"
								/>
							</Table.Cell>
							<Table.Cell class="p-0">
								<DeadlineCell value={draftDueAt} onchange={(value) => (draftDueAt = value)} />
							</Table.Cell>
							<Table.Cell class="p-0">
								<SelectCell
									value={draftStatus}
									items={statusItems}
									onchange={(value) => (draftStatus = value as AssignmentStatus)}
								/>
							</Table.Cell>
							<Table.Cell class="p-0">
								<SelectCell
									value={draftPriority}
									items={priorityItems}
									onchange={(value) => (draftPriority = value as AssignmentPriority | '')}
								/>
							</Table.Cell>
							<Table.Cell class="p-0">
								<input
									bind:value={draftTaskUrl}
									placeholder="Empty"
									class="placeholder:text-muted-foreground/40 w-full bg-transparent px-3 py-2 text-sm outline-none"
								/>
							</Table.Cell>
							<Table.Cell class="p-0" />
						</Table.Row>
					{/if}
				</Table.Body>
			</Table.Root>

			<button
				type="button"
				class="border-border text-muted-foreground hover:bg-muted/50 flex w-full items-center gap-2 border-t px-4 py-2 text-sm transition-colors"
				onclick={addDraft}
			>
				<PlusIcon class="size-3.5" />
				Tambah tugas
			</button>
		{/if}
	</div>
</section>
