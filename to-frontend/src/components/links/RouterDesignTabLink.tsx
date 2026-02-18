import * as React from "react";
import {useRef} from "react";
import {NavLink as RCNavLink} from "react-router";

export const RouterDesignTabLink = (
    {to, children }: React.PropsWithChildren<{ to: string }>
) => {
    // const {pathname} = useLocation();
    // const routerNavigate = useNavigate();
    const linkElement = useRef<HTMLAnchorElement | null>(null)

    // const onLinkClick: MouseEventHandler<HTMLElement> = (e) => {
    //     // e.preventDefault();
    //     // e.stopPropagation();
    //     // routerNavigate(to);
    //     if (linkElement != null && linkElement.current != null) {
    //         linkElement.current.style.setProperty("border-color", "#fff", "important");
    //         // linkElement.current.setAttribute("data-focus-mouse", "false");
    //         // linkElement.current.classList.remove("focus--mouse");
    //     }
    // }


    return (
        // <DRKNavLink href={to}
        //             active={pathname.startsWith(to)}
        //             onClick={onLinkClick}
        // > {children} </DRKNavLink>

        // in design-react-kit il nav-link è un come un NavLink di react ma con la classe nav-link applicata che viene
        //   ripresa da bootstrap italia. mettendola nel NavLink di react-router abbiamo che la pagina non refresha da capo
        <RCNavLink to={to} className={"nav-link"} ref={linkElement}>
            {children}
            {/*// non funziona: genera due tag a annidati che non è consentito*/}
            {/*{({isActive}) => (*/}
            {/*    <DRKNavLink href={to} active={isActive}> {children} </DRKNavLink>*/}
            {/*)}*/}
        </RCNavLink>
    )
}