"use client";

import * as React from "react";
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Car, FolderClosed, SquareTerminal, Wrench } from "lucide-react";
import Link from "next/link";

export const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Parc Auto",
      label: "interface",
      url: "/",
      icon: Car,

      items: [
        {
          title: "Contrat actuel",
          url: "/contrat-actuel",
        },
        {
          title: "Parc par client",
          url: "/parc-par-client",
        },
        {
          title: "Les véhicules vendus",
          url: "/vehicules-vendus",
        },
        {
          title: "La VR des véhicules",
          url: "/vr-vehicules",
        },
        {
          title: "Les véhicules achetés",
          url: "/vehicules-achetes",
        },
        {
          title: "Suivi des marchés",
          url: "/suivi-marches",
        },
      ],
    },
    {
      title: "Etats",
      label: "statistiques",
      url: "#",
      icon: FolderClosed,
      items: [
        {
          title: "Commandes en cours",
          url: "/commandes-en-cours",
        },
        {
          title: "Liste des entretiens",
          url: "/liste-entretiens",
        },
        {
          title: "Pneumatiques",
          url: "/pneumatiques",
        },
        {
          title: "Projection KM",
          url: "/projection-km",
        },
        {
          title: "Sinistres",
          url: "/sinistres",
        },
        {
          title: "Vidanges",
          url: "/vidanges",
        },
      ],
    },
    {
      title: "Status des Véhicules",
      label: "Status des Véhicules",
      url: "#",
      icon: Wrench,
      items: [
        {
          title: "Mouvements ouverts",
          url: "/mouvements-ouverts",
        },
        {
          title: "Véhicule en attente",
          url: "/vehicule-en-attente",
        },
        {
          title: "Véhicules disponibles",
          url: "/vehicules-disponibles",
        },
      ],
    },
    {
      title: "Analyse Financière",
      label: "Analyse Financière",
      url: "#",
      icon: SquareTerminal,
      items: [
        {
          title: "Revenue par voiture",
          url: "/revenue-par-voiture",
        },
        {
          title: "Marge par client",
          url: "/marge-par-client",
        }
      ],
    },
    {
      title: "Récap Client",
      label: "Ancien client",
      url: "#",
      icon: SquareTerminal,
      items: [
        {
          title: "Entretiens Car",
          url: "/entretiens-car",
        },
        {
          title: "Entretiens Client",
          url: "/entretiens-client",
        },
        {
          title: "Pneus KMs",
          url: "/pneus-kms",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
