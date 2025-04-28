import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavMain({ items }) {
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item, index) => (
          <div key={index}>
            <SidebarGroupLabel
              key={item.url}
              className={"text-muted-foreground uppercase"}
            >
              {item.label}
            </SidebarGroupLabel>
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <Link href={subItem.url}>
                          <SidebarMenuSubButton
                            tooltip={subItem.title}
                            className={cn(
                              "relative",
                              pathname === subItem.url &&
                                "bg-accent text-accent-foreground"
                            )}
                          >
                            {subItem.icon && <subItem.icon />}
                            <span>{subItem.title}</span>
                            {pathname === subItem.url && (
                              <span className="absolute left-0 h-full w-1 bg-gray-500 rounded-r-lg" />
                            )}
                          </SidebarMenuSubButton>
                        </Link>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </div>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
