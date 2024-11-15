import type { CreateQueryResult } from '@tanstack/svelte-query'
import type { ProductsFilter } from '$lib/schema'
import type { DisplayProduct } from '$lib/server/products.service'
import { createQuery } from '@tanstack/svelte-query'
import { numSatsInBtc } from '$lib/constants'
import { aggregatorAddProducts } from '$lib/nostrSubs/data-aggregator'
import { fetchUserProductData, normalizeProductsFromNostr } from '$lib/nostrSubs/utils'
import { productsFilterSchema } from '$lib/schema'
import { btcToCurrency, resolveQuery } from '$lib/utils'

import { CURRENCIES } from '@plebeian/database/constants'

import { createRequest, queryClient } from './client'

declare module './client' {
	interface Endpoints {
		'GET /api/v1/products': Operation<
			'/api/v1/products',
			'GET',
			never,
			never,
			{ total: number; products: Partial<DisplayProduct>[] },
			ProductsFilter
		>
		[k: `GET /api/v1/products/${string}`]: Operation<string, 'GET', never, never, DisplayProduct, never>
		[k: `GET /api/v1/products/${string}?exists`]: Operation<string, 'GET', never, never, boolean, never>
	}
}

export const createProductQuery = (productId: string) =>
	createQuery<DisplayProduct | null>(
		{
			queryKey: ['products', productId],
			queryFn: async () => {
				try {
					const response = await createRequest(`GET /api/v1/products/${productId}`, {
						auth: false,
					})
					if (response) return response
					throw new Error(`failed fetching product: ${productId}`)
				} catch {
					const [_, userId, productIdentifier] = productId.split(':')
					const { products: productsData } = await fetchUserProductData(userId, productIdentifier)
					if (productsData?.size) {
						const result = await normalizeProductsFromNostr(productsData, userId)
						if (result) {
							const { toDisplayProducts, stallProducts } = result
							aggregatorAddProducts(stallProducts)

							return toDisplayProducts[0] as DisplayProduct
						}
					}
				}
				return null
			},
		},
		queryClient,
	)

type Currency = (typeof CURRENCIES)[number]
type CurrencyQuery = Record<Currency, CreateQueryResult<number>>

export const currencyQueries: CurrencyQuery = {} as CurrencyQuery

for (const c of CURRENCIES) {
	currencyQueries[c] = createQuery(
		{
			queryKey: ['currency-conversion', c],
			staleTime: 1000 * 60 * 60,
			queryFn: async () => {
				const price = await btcToCurrency(c)
				if (price == null) {
					throw new Error(`failed fetching currency: ${c}`)
				}
				return price
			},
			retryDelay: 1000,
		},
		queryClient,
	)
}

export const createCurrencyConversionQuery = (fromCurrency: string, amount: number) =>
	createQuery<number | null>(
		{
			queryKey: ['currency-conversion', fromCurrency, amount],
			queryFn: async () => {
				if (!fromCurrency || !amount) return null
				if (['sats', 'sat'].includes(fromCurrency.toLowerCase())) {
					return amount
				}
				const price = await resolveQuery(() => currencyQueries[fromCurrency as Currency])
				const result = (amount / price) * numSatsInBtc
				return result
			},
			enabled: amount > 0,
			staleTime: 1000 * 60 * 60,
		},
		queryClient,
	)

export const createProductsByFilterQuery = (filter: Partial<ProductsFilter>) =>
	createQuery<{ total: number; products: Partial<DisplayProduct>[] } | null>(
		{
			queryKey: ['products', ...Object.values(filter)],
			queryFn: async () => {
				try {
					const response = await createRequest('GET /api/v1/products', {
						params: productsFilterSchema.parse(filter),
					})
					if (response.products.length) return response
					throw Error
				} catch (error) {
					const userId = (filter.stallId && filter.stallId.split(':')[1]) || filter?.userId || null
					if (!userId) return null
					const { products: productsData } = await fetchUserProductData(userId)

					if (filter.stallId) {
						if (productsData?.size) {
							const result = await normalizeProductsFromNostr(productsData, userId, filter.stallId)
							if (result) {
								const { toDisplayProducts, stallProducts } = result
								aggregatorAddProducts(stallProducts)

								return {
									total: toDisplayProducts.length,
									products: toDisplayProducts as DisplayProduct[],
								}
							}
						}
					} else if (filter.userId) {
						if (productsData?.size) {
							aggregatorAddProducts(productsData)
							const result = await normalizeProductsFromNostr(productsData, filter.userId)
							if (result) {
								const { toDisplayProducts } = result
								return {
									total: toDisplayProducts.length,
									products: toDisplayProducts as DisplayProduct[],
								}
							}
						}
					}
				}

				return null
			},
		},
		queryClient,
	)

export const createProductExistsQuery = (id: string) =>
	createQuery<boolean>(
		{
			queryKey: ['products', 'exists', id],
			queryFn: async () => {
				const stallExists = await createRequest(`GET /api/v1/products/${id}?exists`, {})
				return stallExists
			},
			staleTime: Infinity,
		},
		queryClient,
	)
