import NDK, { NDKEvent, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk'
import { KindProducts } from '$lib/constants'
import { getAllStalls } from '$lib/server/stalls.service'
import { describe, expect, it } from 'vitest'

import { createId, devUser1 } from '@plebeian/database'

describe('/products', () => {
	it('GET', async () => {
		const result = await fetch(`http://${process.env.APP_HOST}:${process.env.APP_PORT}/api/v1/products`).then((response) => response.json())

		expect(result.products).toHaveLength(10)
	})

	// it('GET with filter', async () => {
	// 	const routeParams = {
	// 		page: '1',
	// 		pageSize: '15',
	// 		order: 'desc',
	// 		orderBy: 'price',
	// 	}

	// 	const result = await fetch(
	// 		`http://${process.env.APP_HOST}:${process.env.APP_PORT}/api/v1/products?${new URLSearchParams(routeParams)}`,
	// 	).then((response) => response.json())

	// 	expect(result).toHaveLength(15)
	// })

	// it('POST', async () => {
	// 	const stallId = await getAllStalls().then((stalls) => stalls[0].id)
	// 	const skSigner = new NDKPrivateKeySigner(devUser1.sk)
	// 	const identifier = createId()
	// 	const evContent = {
	// 		id: identifier,
	// 		stall_id: stallId,
	// 		name: 'Hello Product',
	// 		description: 'Hello Description',
	// 		images: ['http://example.com/image1.jpg', 'http://example.com/image2.jpg'],
	// 		currency: 'USD',
	// 		price: 133,
	// 		quantity: 6,
	// 		specs: [
	// 			['color', 'red'],
	// 			['size', 'medium'],
	// 		],
	// 		shipping: [
	// 			{
	// 				id: createId(),
	// 				name: 'USPS',
	// 				cost: '21.21',
	// 				regions: ['USA', 'CAN'],
	// 			},
	// 		],
	// 	}
	// 	const newEvent = new NDKEvent(new NDK({ signer: skSigner }), {
	// 		kind: KindProducts,
	// 		pubkey: devUser1.pk,
	// 		content: JSON.stringify(evContent),
	// 		created_at: Math.floor(Date.now()),
	// 		tags: [['d', identifier]],
	// 	})

	// 	await newEvent.sign(skSigner)
	// 	const nostrEvent = await newEvent.toNostrEvent()
	// 	const result = await fetch(`http://${process.env.APP_HOST}:${process.env.APP_PORT}/api/v1/products`, {
	// 		method: 'POST',
	// 		body: JSON.stringify(nostrEvent),
	// 		headers: {
	// 			'Content-Type': 'application/json',
	// 		},
	// 	}).then((response) => response.json())

	// 	expect(result).toStrictEqual({
	// 		id: expect.any(String),
	// 		createdAt: expect.any(String),
	// 		currency: 'USD',
	// 		description: 'Hello Description',
	// 		identifier: identifier,
	// 		userId: devUser1.pk,
	// 		userNip05: expect.any(String),
	// 		images: ['http://example.com/image1.jpg', 'http://example.com/image2.jpg'],
	// 		name: 'Hello Product',
	// 		price: 133,
	// 		quantity: 6,
	// 	})
	// })

	// it('GET products by user id', async () => {
	// 	const result = await fetch(`http://${process.env.APP_HOST}:${process.env.APP_PORT}/api/v1/products?userId=${devUser1}`).then(
	// 		(response) => response.json(),
	// 	)

	// 	expect(result.length).toBeGreaterThan(0)
	// })
})
