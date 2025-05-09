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
import { useState } from "react";
import { cn } from "@/lib/utils";

export function NavMain({ items }) {
  const pathname = usePathname();
  // State to track which dropdown is currently open
  const [openDropdown, setOpenDropdown] = useState(null);

  const handleToggleDropdown = (index) => {
    // If clicking the same dropdown that's already open, close it
    // Otherwise, open the clicked dropdown and close any previously open one
    setOpenDropdown(openDropdown === index ? null : index);
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item, index) => {
          // Determine if this item should be open based on state
          const isOpen = openDropdown === index;
          
          return (
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
                open={isOpen}
                onOpenChange={() => handleToggleDropdown(index)}
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
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}