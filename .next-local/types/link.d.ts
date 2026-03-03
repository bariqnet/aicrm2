// Type definitions for Next.js routes

/**
 * Internal types used by the Next.js router and Link component.
 * These types are not meant to be used directly.
 * @internal
 */
declare namespace __next_route_internal_types__ {
  type SearchOrHash = `?${string}` | `#${string}`
  type WithProtocol = `${string}:${string}`

  type Suffix = '' | SearchOrHash

  type SafeSlug<S extends string> = S extends `${string}/${string}`
    ? never
    : S extends `${string}${SearchOrHash}`
    ? never
    : S extends ''
    ? never
    : S

  type CatchAllSlug<S extends string> = S extends `${string}${SearchOrHash}`
    ? never
    : S extends ''
    ? never
    : S

  type OptionalCatchAllSlug<S extends string> =
    S extends `${string}${SearchOrHash}` ? never : S

  type StaticRoutes = 
    | `/api/ai/relationship-intelligence`
    | `/api/activities`
    | `/api/auth/me`
    | `/api/auth/refresh`
    | `/api/auth/sign-in`
    | `/api/auth/sign-out`
    | `/api/auth/sign-up`
    | `/api/companies`
    | `/api/contacts/bulk-delete`
    | `/api/contacts/export`
    | `/api/contacts/import`
    | `/api/contacts`
    | `/api/deals`
    | `/api/invites/accept`
    | `/api/invoices`
    | `/api/invites`
    | `/api/memberships`
    | `/api/notes`
    | `/api/notifications/mark-all-read`
    | `/api/notifications`
    | `/api/onboarding/invites`
    | `/api/onboarding/stages`
    | `/api/onboarding/workspace`
    | `/api/reminders`
    | `/api/stages`
    | `/api/stages/reorder`
    | `/api/tasks`
    | `/api/users`
    | `/api/session`
    | `/api/workspaces`
    | `/api/workspaces/switch`
    | `/api/visits`
    | `/`
    | `/callops`
    | `/companies`
    | `/companies/new`
    | `/calendar`
    | `/contacts/new`
    | `/contacts`
    | `/contacts/import`
    | `/dashboard`
    | `/deals/new`
    | `/deals`
    | `/invoices/new`
    | `/`
    | `/invoices`
    | `/profile`
    | `/reports`
    | `/settings`
    | `/tasks`
    | `/tasks/new`
    | `/visits`
    | `/auth/sign-in`
    | `/auth/sign-up`
    | `/auth`
    | `/onboarding`
  type DynamicRoutes<T extends string = string> = 
    | `/api/companies/${SafeSlug<T>}`
    | `/api/contacts/${SafeSlug<T>}`
    | `/api/deals/${SafeSlug<T>}`
    | `/api/invoices/${SafeSlug<T>}`
    | `/api/invites/${SafeSlug<T>}`
    | `/api/memberships/${SafeSlug<T>}`
    | `/api/notifications/${SafeSlug<T>}`
    | `/api/notes/${SafeSlug<T>}`
    | `/api/reminders/${SafeSlug<T>}`
    | `/api/stages/${SafeSlug<T>}`
    | `/api/tasks/${SafeSlug<T>}`
    | `/api/visits/${SafeSlug<T>}`
    | `/print/invoices/${SafeSlug<T>}`
    | `/companies/${SafeSlug<T>}/edit`
    | `/companies/${SafeSlug<T>}`
    | `/contacts/${SafeSlug<T>}/edit`
    | `/contacts/${SafeSlug<T>}`
    | `/deals/${SafeSlug<T>}/edit`
    | `/deals/${SafeSlug<T>}`
    | `/invoices/${SafeSlug<T>}/edit`
    | `/invoices/${SafeSlug<T>}`
    | `/tasks/${SafeSlug<T>}`
    | `/auth/invite/${SafeSlug<T>}`

  type RouteImpl<T> = 
    | StaticRoutes
    | SearchOrHash
    | WithProtocol
    | `${StaticRoutes}${SearchOrHash}`
    | (T extends `${DynamicRoutes<infer _>}${Suffix}` ? T : never)
    
}

declare module 'next' {
  export { default } from 'next/types.js'
  export * from 'next/types.js'

  export type Route<T extends string = string> =
    __next_route_internal_types__.RouteImpl<T>
}

declare module 'next/link' {
  import type { LinkProps as OriginalLinkProps } from 'next/dist/client/link.js'
  import type { AnchorHTMLAttributes, DetailedHTMLProps } from 'react'
  import type { UrlObject } from 'url'

  type LinkRestProps = Omit<
    Omit<
      DetailedHTMLProps<
        AnchorHTMLAttributes<HTMLAnchorElement>,
        HTMLAnchorElement
      >,
      keyof OriginalLinkProps
    > &
      OriginalLinkProps,
    'href'
  >

  export type LinkProps<RouteInferType> = LinkRestProps & {
    /**
     * The path or URL to navigate to. This is the only required prop. It can also be an object.
     * @see https://nextjs.org/docs/api-reference/next/link
     */
    href: __next_route_internal_types__.RouteImpl<RouteInferType> | UrlObject
  }

  export default function Link<RouteType>(props: LinkProps<RouteType>): JSX.Element
}

declare module 'next/navigation' {
  export * from 'next/dist/client/components/navigation.js'

  import type { NavigateOptions, AppRouterInstance as OriginalAppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
  interface AppRouterInstance extends OriginalAppRouterInstance {
    /**
     * Navigate to the provided href.
     * Pushes a new history entry.
     */
    push<RouteType>(href: __next_route_internal_types__.RouteImpl<RouteType>, options?: NavigateOptions): void
    /**
     * Navigate to the provided href.
     * Replaces the current history entry.
     */
    replace<RouteType>(href: __next_route_internal_types__.RouteImpl<RouteType>, options?: NavigateOptions): void
    /**
     * Prefetch the provided href.
     */
    prefetch<RouteType>(href: __next_route_internal_types__.RouteImpl<RouteType>): void
  }

  export function useRouter(): AppRouterInstance;
}

declare module 'next/form' {
  import type { FormProps as OriginalFormProps } from 'next/dist/client/form.js'

  type FormRestProps = Omit<OriginalFormProps, 'action'>

  export type FormProps<RouteInferType> = {
    /**
     * `action` can be either a `string` or a function.
     * - If `action` is a string, it will be interpreted as a path or URL to navigate to when the form is submitted.
     *   The path will be prefetched when the form becomes visible.
     * - If `action` is a function, it will be called when the form is submitted. See the [React docs](https://react.dev/reference/react-dom/components/form#props) for more.
     */
    action: __next_route_internal_types__.RouteImpl<RouteInferType> | ((formData: FormData) => void)
  } & FormRestProps

  export default function Form<RouteType>(props: FormProps<RouteType>): JSX.Element
}
