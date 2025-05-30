<script lang="ts">
	import { fetchRequest } from '$lib/FetchRequest';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { Thread } from '$lib/Group/interface';
	import NotificationOptions from '$lib/Generic/NotificationOptions.svelte';
	import Fa from 'svelte-fa';
	import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import Comments from '$lib/Comments/Comments.svelte';
	import Layout from '$lib/Generic/Layout.svelte';
	import Poppup from '$lib/Generic/Poppup.svelte';
	import type { poppup } from '$lib/Generic/Poppup';
	import NewDescription from '$lib/Poll/NewDescription.svelte';
	import MultipleChoices from '$lib/Generic/MultipleChoices.svelte';

	let thread: Thread, poppup: poppup;

	onMount(() => {
		getThread();
	});

	const getThread = async () => {
		const { json, res } = await fetchRequest(
			'GET',
			`group/thread/list?group_ids=${$page.params.groupId}&id=${$page.params.threadId}`
		);

		if (!res.ok) {
			poppup = { message: 'Could not get Thread', success: false };
			return;
		}

		thread = json.results[0];
		if (thread.description === null) thread.description = '';		
	};
</script>

<Layout centered>
	{#if thread}
		<div
			class="bg-white dark:bg-darkobject dark:text-darkmodeText rounded shadow w-full poll-header-grid items-center py-4"
		>
			<div
				class="cursor-pointer bg-white dark:bg-darkobject dark:text-darkmodeText justify-center m-auto"
				on:click={() => goto(`/groups/${$page.params.groupId}?page=flow`)}
				on:keydown
				role="button"
				tabindex="0"
			>
				<Fa icon={faArrowLeft} />
			</div>

			<h1 class="text-left text-2xl text-primary dark:text-secondary font-semibold">{thread.title}</h1>

			<div class="flex inline-flex gap-4 items-baseline">
				<NotificationOptions
					type="group_thread"
					id={thread.id}
					api={`group/thread/${thread.id}`}
					categories={['thread']}
					labels={['thread']}
				/>
				<MultipleChoices
					labels={[$_('Delete Thread,'), $_('Report Thread')]}
					functions={[]}
					Class="text-black justify-self-center"
				/>
			</div>

			<div class="grid-area-workgroup">
				{#if thread.work_group}
					<span class="text-sm text-gray-500 dark:text-darkmodeText">#{thread.work_group?.name}, </span>
				{/if}
				{#if thread.created_at}
					<span class="text-sm text-gray-500 dark:text-darkmodeText">
						{new Date(thread.created_at).toISOString().split('T')[0].replace(/-/g, '.')}
					</span>
				{/if}
			</div>

			{#if thread.description.length > 0}
				<div class="grid-area-description py-2">
					<NewDescription bind:description={thread.description} limit={3} lengthLimit={300} />
				</div>
			{/if}
		</div>
	{/if}

	<Comments api={'thread'} Class="w-full max-w-[1000px] bg-white dark:bg-darkobject p-6 mt-6" />
</Layout>

<Poppup bind:poppup />

<style>
	.poll-header-grid {
		display: grid;
		grid-template-columns: 0.3fr 4fr 0.3fr;
		grid-template-rows: 0.1fr 0.1fr 0.1fr 1fr;
	}

	.grid-area-items {
		grid-area: 2 / 2 / 3 / 3;
	}

	.grid-area-description {
		grid-area: 4 / 2 / 4 / 3;
	}

	.grid-area-workgroup {
		grid-area: 3 / 2 / 3 / 3;
	}
</style>
