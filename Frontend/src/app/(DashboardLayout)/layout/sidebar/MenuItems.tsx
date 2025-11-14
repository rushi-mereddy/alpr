import {
  IconAperture,
  IconCopy,
  IconLayoutDashboard,
  IconSettings2,
  IconLogin,
  IconMoodHappy,
  IconTypography,
  IconUserPlus,
} from "@tabler/icons-react";

import { uniqueId } from "lodash";

const Menuitems = [
  {
    id: uniqueId(),
    title: "Dashboard",
    icon: IconLayoutDashboard,
    href: "/",
  },
  {
    id: uniqueId(),
    title: "Configure",
    icon: IconSettings2,
    href: "/admin/configure",
  },
];

export default Menuitems;
