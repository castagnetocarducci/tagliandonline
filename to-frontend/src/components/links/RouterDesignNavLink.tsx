import {NavLink as RCNavLink} from "react-router";
import * as React from "react";
import {useRef} from "react";

export const RouterDesignNavLink = (
    {openNav, setOpenNav, to, children}: React.PropsWithChildren<{ openNav: boolean, setOpenNav: (newValue: boolean) => void, to: string }>
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

    // per chiudere la tab automaticamente quando cliccano gli utenti da mobile
    const checkAndToggleNav = () => {
        if (openNav) {
            setOpenNav(false);
        }
    }

    return (
        // <DRKNavLink href={to}
        //             active={pathname.startsWith(to)}
        //             onClick={onLinkClick}
        // > {children} </DRKNavLink>

        // in design-react-kit il nav-link è un come un NavLink di react ma con la classe nav-link applicata che viene
        //   ripresa da bootstrap italia. mettendola nel NavLink di react-router abbiamo che la pagina non refresha da capo
        <RCNavLink to={to} className={"nav-link"} ref={linkElement} onClick={checkAndToggleNav} style={({isActive}) => {
            //questo style serve perché utilizzando react-router il pulsante "rimane premuto" e non si capisce che siamo entranti nel menu
            // succede perché nei siti normali la pagina si ricarica del tutto e quindi non ha più il focus
            if (linkElement != null && linkElement.current != null) {
                if (isActive) {
                    linkElement.current.style.setProperty("border-color", "#fff", "important");
                } else {
                    linkElement.current.style.removeProperty("border-color");
                }
            }
            return {};
        }}>
            {children}
            {/*// non funziona: genera due tag a annidati che non è consentito*/}
            {/*{({isActive}) => (*/}
            {/*    <DRKNavLink href={to} active={isActive}> {children} </DRKNavLink>*/}
            {/*)}*/}
        </RCNavLink>
    )
}