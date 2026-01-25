import {Link as RCLink} from "react-router";
import * as React from "react";

export const RouterDesignLink = (
    {to, className, children}: React.PropsWithChildren<{ to: string, className: string }>
) => {

    return (
        // <DRKNavLink href={to}
        //             active={pathname.startsWith(to)}
        //             onClick={onLinkClick}
        // > {children} </DRKNavLink>

        // in design-react-kit il nav-link è un come un NavLink di react ma con la classe nav-link applicata che viene
        //   ripresa da bootstrap italia. mettendola nel NavLink di react-router abbiamo che la pagina non refresha da capo
        <RCLink to={to} className={className}>
            {children}
            {/*// non funziona: genera due tag a annidati che non è consentito*/}
            {/*{({isActive}) => (*/}
            {/*    <DRKNavLink href={to} active={isActive}> {children} </DRKNavLink>*/}
            {/*)}*/}
        </RCLink>
    )
}