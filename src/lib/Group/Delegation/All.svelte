<script lang="ts">
	import { fetchRequest } from '$lib/FetchRequest';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Button from '$lib/Generic/Button.svelte';
	import { _ } from 'svelte-i18n';
	import Loader from '$lib/Generic/Loader.svelte';
	import { delegation as delegationLimit } from '../../Generic/APILimits.json';
	import SuccessPoppup from '$lib/Generic/SuccessPoppup.svelte';
	import {
		becomeDelegate,
		delegate
	} from '$lib/Blockchain_v1_Ethereum/javascript/delegationsBlockchain';
	import { isNumber } from 'chart.js/helpers';
	import type { Delegate, DelegateRelation } from './interfaces';
	import { env } from '$env/dynamic/public';
	import ProfilePicture from '$lib/Generic/ProfilePicture.svelte';

	let delegates: Delegate[] = [],
		delegateRelations: DelegateRelation[] = [],
		userIsDelegate: boolean = false,
		userId: number,
		loading = false,
		show = false,
		message = '';

	export let history: number | null, selectedPage: 'All' | 'Selected' | 'History';

	onMount(async () => {
		userId = (await fetchRequest('GET', 'user')).json.id;
		await getDelegatePools();
		getUserInfo();
		getDelegateRelations();
	});

	const getUserInfo = async () => {
		const { res, json } = await fetchRequest(
			'GET',
			`group/${$page.params.groupId}/users?user_id=${localStorage.getItem('userId')}&delegate=true`
		);
		if (json.results.length === 1) userIsDelegate = true;
	};

	const createDelegation = async () => {
		await createDelegationPool();
		// TOOD-Blockchain: Set this up so it works
		loading = true;

		if (env.PUBLIC_BLOCKCHAIN_INTEGRATION === 'TRUE') await becomeDelegate($page.params.groupId);

		loading = false;
		// await becomeDelegate(Number($page.params.groupId));
		getDelegatePools();
	};

	const deleteDelegation = async () => {
		await deleteDelegationPool();
		getDelegatePools();
		userIsDelegate = false;
	};

	/*
		Temporary fix to make each delegate pool be associated with one user.
		TODO: Implement delegate pool feature in the front end (Figma design first)
	*/
	const getDelegatePools = async () => {
		loading = true;
		const { json, res } = await fetchRequest(
			'GET',
			`group/${$page.params.groupId}/delegate/pools?limit=${delegationLimit}`
		);

		// TODO: Might be worth doing this on most if not all messages, but that might require some refactoring.
		setTimeout(() => {
			if (loading === true) {
				loading = false;
				show = true;
				message = 'Something went wrong';
			}
		}, 25000);

		if (!res.ok) return;

		delegates = json.results.map((delegatePool: any) => {
			return { ...delegatePool.delegates[0].group_user, pool_id: delegatePool.id };
		});

		loading = false;
	};

	/*
	 	Makes the currently logged in user into a delegate(pool)
	 */
	const createDelegationPool = async () => {
		loading = true;
		let toSend: any = {};

		if (env.PUBLIC_BLOCKCHAIN_INTEGRATION === 'TRUE')
			try {
				const blockchain_id = becomeDelegate($page.params.groupId);
				if (isNumber(blockchain_id)) toSend.blockchain_id = blockchain_id;
			} catch {
				toSend.blockchain_id = 4;
				console.warn('Error');
			}

		const { res } = await fetchRequest(
			'POST',
			`group/${$page.params.groupId}/delegate/pool/create`,
			toSend
		);

		if (!res.ok) return;

		loading = false;
		userIsDelegate = true;

		// userIsDelegateStore.update((value) => (value = true));
	};

	/*
		Makes the currently logged in user no longer a delegate(pool)
	*/
	const deleteDelegationPool = async () => {
		loading = true;
		const { res } = await fetchRequest(
			'POST',
			`group/${$page.params.groupId}/delegate/pool/delete`
		);
		loading = false;

		if (!res.ok) return;

		userIsDelegate = false;
		// userIsDelegateStore.update((value) => (value = false));
	};

	const getDelegateRelations = async () => {
		loading = true;
		const { json } = await fetchRequest(
			'GET',
			`group/${$page.params.groupId}/delegates?limit=${delegationLimit}`
		);
		loading = false;

		//Determines whether to show the "remove as delegate" or "add as delegate" buttons, depening on if user already has delegated or not earlier.
		json.results.forEach((relation: any) => {
			delegates.map((delegate) => {
				if (delegate.pool_id === relation.delegate_pool_id) delegate.isInRelation = true;
				return delegate;
			});
		});
		delegateRelations = json.results;
	};

	const createDelegateRelation = async (delegate_pool_id: number) => {
		loading = true;
		const { res } = await fetchRequest('POST', `group/${$page.params.groupId}/delegate/create`, {
			delegate_pool_id
		});

		loading = false;
		if (!res.ok) return;

		delegates[
			delegates.findIndex((delegate) => delegate.pool_id === delegate_pool_id)
		].isInRelation = true;

		delegate($page.params.groupId);
	};

	const deleteDelegateRelation = async (delegate_pool_id: number) => {
		loading = true;
		const { res } = await fetchRequest('POST', `group/${$page.params.groupId}/delegate/delete`, {
			delegate_pool_id
		});

		loading = false;
		if (!res.ok) return;

		delegates[
			delegates.findIndex((delegate) => delegate.pool_id === delegate_pool_id)
		].isInRelation = false;
	};
</script>

{#if delegates.length > 0 && loading === false}
	<ul class="w-full">
		{#each delegates as delegate}
			<li
				class="bg-white dark:bg-darkobject dark:text-darkmodeText p-3 w-full border-b-2 border-gray-200 flex justify-between items-center"
			>
				<ProfilePicture
					username={delegate.user.username}
					displayName
					profilePicture={delegate.user.profile_image}
				/>

				<button
					on:keydown
					class="text-gray-500 dark:text-gray-400 cursor-pointer hover:underline"
					on:click={() => {
						history = delegate.pool_id;
						selectedPage = 'History';
					}}>{$_('See delegate history')}</button
				>

				{#if delegate.isInRelation && !userIsDelegate}
					<Button Class={'bg-red-500'} onClick={() => deleteDelegateRelation(delegate.pool_id)}
						>{$_('Remove as delegate')}</Button
					>

					<!-- If not delegate, display "add as delegate" button -->
				{:else if !userIsDelegate}
					<Button
						buttonStyle="primary-light"
						onClick={() => createDelegateRelation(delegate.pool_id)}>{$_('Add as delegate')}</Button
					>
				{/if}
			</li>
		{/each}
	</ul>
{:else if delegates.length > 0 && loading === false}
	<div>{$_('No delegates in group')}</div>
{:else if loading === true}
	<Loader bind:loading />
{/if}

{#if userIsDelegate}
	<Button Class="mt-3 bg-red-500" onClick={deleteDelegation}>{$_('Stop being delegate')}</Button>
{:else}
	<Button Class="mt-3" buttonStyle="primary-light" onClick={createDelegation}
		>{$_('Become delegate')}</Button
	>
{/if}

<SuccessPoppup bind:show bind:message />
