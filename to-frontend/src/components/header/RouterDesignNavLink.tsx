import {NavLink as RCNavLink} from "react-router";
import {NavLink as DRKNavLink} from "design-react-kit";
import * as React from "react";

export const RouterDesignNavLink = (
    {to, children}: React.PropsWithChildren<{to: string}>
) => {
    return (
        <RCNavLink to={to}>
            {({isActive}) => (
                <DRKNavLink href={to} active={isActive}> {children} </DRKNavLink>
            )}
        </RCNavLink>
    )
}