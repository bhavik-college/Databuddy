import { Elysia, t } from "elysia";
import { authMiddleware } from "../../middleware/auth";
import { websiteMiddleware } from "../../middleware/website";
import { timezoneMiddleware } from "../../middleware/timezone";
import { WebsiteType } from "../../types";
import { User } from "../../lib/auth";
import { TimezoneInfo } from "../../lib/timezone";

const domainsRouter = new Elysia({
    prefix: '/v1/domains'
})
    .use(authMiddleware())
    .use(websiteMiddleware({ required: true }))
    .use(timezoneMiddleware)
    .get('/', ({ user, website, timezoneInfo }: { user: User, website: WebsiteType, timezoneInfo: TimezoneInfo }) => {
        return {
            user,
            website,
            timezoneInfo
        };
    });

export default domainsRouter;