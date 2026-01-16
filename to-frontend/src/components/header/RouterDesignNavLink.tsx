import {NavLink as RCNavLink, useLocation} from "react-router";
import {NavLink as DRKNavLink} from "design-react-kit";
import * as React from "react";

export const RouterDesignNavLink = (
    {to, children}: React.PropsWithChildren<{to: string}>
) => {
    const { pathname } = useLocation();
    return (
        <DRKNavLink href={to} active={pathname.startsWith(to)}> {children} </DRKNavLink>
        // non funziona: genera due tag a annidati che non è consentito
        // <RCNavLink  to={to}>
        //     {({isActive}) => (
        //         <DRKNavLink href={to} active={isActive}> {children} </DRKNavLink>
        //     )}
        // </RCNavLink>
    )
}