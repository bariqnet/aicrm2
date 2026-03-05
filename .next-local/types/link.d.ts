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
    | `/api/activities`
    | `/api/auth/me`
    | `/api/ai/relationship-intelligence`
    | `/api/auth/sign-out`
    | `/api/auth/sign-up`
    | `/api/auth/sign-in`
    | `/api/auth/refresh`
    | `/api/contacts/bulk-delete`
    | `/api/contacts`
    | `/api/deals`
    | `/api/contacts/export`
    | `/api/invites/accept`
    | `/api/contacts/import`
    | `/api/invoices`
    | `/api/memberships`
    | `/api/notes`
    | `/api/companies`
    | `/api/onboarding/invites`
    | `/api/onboarding/workspace`
    | `/api/onboarding/stages`
    | `/api/notifications`
    | `/api/session`
    | `/api/stages/reorder`
    | `/api/reminders`
    | `/api/invites`
    | `/api/users`
    | `/api/workspaces/switch`
    | `/api/workspaces`
    | `/api/tasks`
    | `/api/notifications/mark-all-read`
    | `/api/stages`
    | `/api/visits`
    | `/`
    | `/support`
    | `/privacy`
    | `/terms`
    | `/callops`
    | `/companies/new`
    | `/calendar`
    | `/companies`
    | `/contacts/new`
    | `/contacts`
    | `/deals/new`
    | `/deals`
    | `/invoices`
    | `/profile`
    | `/reports`
    | `/tasks/new`
    | `/contacts/import`
    | `/tasks`
    | `/dashboard`
    | `/visits`
    | `/auth`
    | `/auth/sign-in`
    | `/auth/sign-up`
    | `/onboarding`
    | `/settings`
    | `/invoices/new`
  type DynamicRoutes<T extends string = string> = 
    | `/api/companies/${SafeSlug<T>}`
    | `/api/deals/${SafeSlug<T>}`
    | `/api/invites/${SafeSlug<T>}`
    | `/api/invoices/${SafeSlug<T>}`
    | `/api/memberships/${SafeSlug<T>}`
    | `/api/notes/${SafeSlug<T>}`
    | `/api/notifications/${SafeSlug<T>}`
    | `/api/contacts/${SafeSlug<T>}`
    | `/api/reminders/${SafeSlug<T>}`
    | `/api/tasks/${SafeSlug<T>}`
    | `/api/visits/${SafeSlug<T>}`
    | `/api/stages/${SafeSlug<T>}`
    | `/print/invoices/${SafeSlug<T>}`
    | `/companies/${SafeSlug<T>}/edit`
    | `/contacts/${SafeSlug<T>}`
    | `/companies/${SafeSlug<T>}`
    | `/deals/${SafeSlug<T>}/edit`
    | `/invoices/${SafeSlug<T>}/edit`
    | `/invoices/${SafeSlug<T>}`
    | `/deals/${SafeSlug<T>}`
    | `/auth/invite/${SafeSlug<T>}`
    | `/tasks/${SafeSlug<T>}`
    | `/contacts/${SafeSlug<T>}/edit`

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
