// import {type ReactNode, useMemo} from 'react';
// import {type UIMatch, useMatches} from "react-router";
import {Breadcrumb, BreadcrumbItem, Container} from "design-react-kit";
import {useLocation} from "react-router";
import {type BreadcrumbType, createBreadcrumb} from "../utils/BeadcrumbPathMapping.ts";
import {RouterDesignLink} from "./links/RouterDesignLink.tsx";

// type HandleType = { breadcrumb: (match: UIMatch<unknown, unknown>) => ReactNode }

export const RouterBreadcrumb = () => {
    // necessita del framework di react-router
    // const matches = useMatches();
    // const filteredMatches = useMemo(() => matches.filter(
    //     (match) =>
    //         match.handle && (match.handle as HandleType).breadcrumb,
    // ), [matches]);

    const location = useLocation();
    const breadcrumbList: BreadcrumbType = location == null || location.pathname == null ? [] : createBreadcrumb(location.pathname);

    return (
        <section>
            <Container>

            <Breadcrumb>

                {
                    breadcrumbList.map((value, index) => {
                        if (index === breadcrumbList.length - 1) {
                            return (
                                <BreadcrumbItem key={index} active>
                                    <RouterDesignLink to={value.path} className={""}>{value.name}</RouterDesignLink>
                                </BreadcrumbItem>
                            )
                        } else {
                            return (
                                <BreadcrumbItem key={index}>
                                    <RouterDesignLink to={value.path} className={""}>{value.name}</RouterDesignLink>
                                    <span className="separator">/</span>
                                </BreadcrumbItem>
                            )
                        }
                    })
                }

                {/*{filteredMatches.map((match, index) => {*/}
                {/*    if (index === filteredMatches.length - 1) {*/}
                {/*        return (*/}
                {/*            <BreadcrumbItem key={index}>*/}
                {/*                {(match.handle as HandleType).breadcrumb(match)}*/}
                {/*                <span className="separator">/</span>*/}
                {/*            </BreadcrumbItem>*/}
                {/*        )*/}
                {/*    } else {*/}
                {/*        return (*/}
                {/*            <BreadcrumbItem key={index} active>*/}
                {/*                {(match.handle as HandleType).breadcrumb(match)}*/}
                {/*            </BreadcrumbItem>*/}
                {/*        )*/}
                {/*    }*/}

                {/*})}*/}

            </Breadcrumb>
            </Container>
        </section>
    );
}
