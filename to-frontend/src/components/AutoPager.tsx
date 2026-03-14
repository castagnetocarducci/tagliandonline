import {Icon, Pager, PagerItem, PagerLink} from "design-react-kit";

export type PagerPageData = {
    currentPage: number,
    totalPages: number
}

export type AutoPagerProps = {
    pageData: PagerPageData,
    onPageChange: (page: number) => void
}

type PagerElemInfo = {
    pageNum: number,
    current: boolean
}

export const AutoPager = ({pageData, onPageChange}: AutoPagerProps) => {
    const pages: PagerElemInfo[] = [];
    if (pageData.totalPages > 1) {
        if (pageData.totalPages <= 9) {
            for (let i = 1; i <= pageData.totalPages; i++) {
                pages.push({pageNum: i, current: i === pageData.currentPage});
            }
        } else {
            if (pageData.currentPage <= 5) {
                for (let i = 1; i <= 7; i++) {
                    pages.push({pageNum: i, current: i === pageData.currentPage});
                }
                pages.push({pageNum: -1, current: false}); //…
                pages.push({pageNum: pageData.totalPages, current: false}); //last
            } else if (pageData.currentPage >= pageData.totalPages - 4) {
                pages.push({pageNum: 1, current: false}); //first
                pages.push({pageNum: -1, current: false}); //…
                for (let i = pageData.totalPages - 6; i <= pageData.totalPages; i++) {
                    pages.push({pageNum: i, current: i === pageData.currentPage});
                }
            } else {
                pages.push({pageNum: 1, current: false}); //first
                pages.push({pageNum: -1, current: false}); //…
                for (let i = pageData.currentPage - 2; i <= pageData.currentPage + 2; i++) {
                    pages.push({pageNum: i, current: i === pageData.currentPage});
                }
                pages.push({pageNum: -1, current: false}); //…
                pages.push({pageNum: pageData.totalPages, current: false}); //last
            }
        }
    }

    const tryPageChange = (page: number) => {
        if (page >= 1 && page <= pageData.totalPages) {
            onPageChange(page);
        }
    }

    return (
        <div className="d-flex justify-content-center">
            {pages.length > 0 && (
                <Pager aria-label="Pagine" className="mb-3">
                    <PagerItem disabled={pageData.currentPage <= 1}>
                        <PagerLink previous onClick={() => tryPageChange(pageData.currentPage - 1)}>
                            <Icon aria-hidden icon="it-chevron-left"/>
                        </PagerLink>
                    </PagerItem>
                    {pages.map((value, index) => (
                        <PagerItem className={value.current ? "" : "d-none d-sm-block"} key={index}>
                            {value.pageNum <= 0 && (
                                <PagerLink tag="span">
                                    …
                                </PagerLink>
                            )}
                            {value.pageNum > 0 && (
                                <PagerLink aria-current={value.current ? "page" : undefined}
                                           onClick={() => tryPageChange(value.pageNum)}>
                                    {value.pageNum}
                                </PagerLink>
                            )}
                        </PagerItem>
                    ))}
                    <PagerItem disabled={pageData.currentPage === pageData.totalPages}>
                        <PagerLink next onClick={() => tryPageChange(pageData.currentPage + 1)}>
                            <Icon aria-hidden icon="it-chevron-right"/>
                        </PagerLink>
                    </PagerItem>
                </Pager>
            )}
        </div>
    )
}
