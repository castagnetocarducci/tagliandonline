const breadcrumbPathMap = new Map<string, string>([
    ["", "Home"],
    ["home", "Home"],
    ["applications", "Domande"],
    ["inspections", "Ispezioni"],
    ["users", "Utenti"],
    ["vouchers", "Tagliandi"],
    ["permits", "Permessi"],
    ["login", "Profilo"]
]);

type SingleBreadcrumb = {
    path: string;
    name: string;
}

export type BreadcrumbType = SingleBreadcrumb[];

export const createBreadcrumb = (path: string | null): BreadcrumbType => {
    if (path == null || path.length === 0) {
        return [];
    }
    const noParameters = path.split("&")[0];
    const splitted = noParameters.split("/");
    const res: BreadcrumbType = [];

    let currentPath = "/";
    splitted.forEach((item, index) => {
        if (item === "home") {
            return;
        }
        if (index === splitted.length - 1 && item === "") {
            return;
        }
        currentPath = currentPath + item;
        const mappedValue = breadcrumbPathMap.get(item);
        if (mappedValue != null) {
            res.push({
                name: mappedValue,
                path: currentPath
            });
        } else {
            res.push({
                name: item,
                path: currentPath
            });
        }
    });
    return res;
}


