import {
  BriefcaseBusiness,
  ClipboardList,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

import { cn } from "@/lib/utils";

type ContactIcon = "mail" | "map" | "phone" | "message" | "briefcase" | "list";

interface ContactItem {
  icon?: ContactIcon;
  label: string;
  description: string;
  value: string;
  href?: string;
}

interface Contact7Props {
  title?: string;
  description?: string;
  items?: ContactItem[];
  emailLabel?: string;
  emailDescription?: string;
  email?: string;
  officeLabel?: string;
  officeDescription?: string;
  officeAddress?: string;
  phoneLabel?: string;
  phoneDescription?: string;
  phone?: string;
  chatLabel?: string;
  chatDescription?: string;
  chatLink?: string;
  className?: string;
}

const iconMap = {
  mail: Mail,
  map: MapPin,
  phone: Phone,
  message: MessageCircle,
  briefcase: BriefcaseBusiness,
  list: ClipboardList,
};

const Contact7 = ({
  title = "Contact Us",
  description = "Have a question or need assistance? Reach out through any of the channels below.",
  items,
  emailLabel = "Email",
  emailDescription = "We respond to all emails within 24 hours.",
  email = "hello@example.com",
  officeLabel = "Office",
  officeDescription = "Drop by our office for a chat.",
  officeAddress = "1 Eagle St, Brisbane, QLD, 4000",
  phoneLabel = "Phone",
  phoneDescription = "We're available Mon-Fri, 9am-5pm.",
  phone = "(123) 456-7890",
  chatLabel = "Live Chat",
  chatDescription = "Get instant help from our support team.",
  chatLink = "Start Chat",
  className,
}: Contact7Props) => {
  const contactItems =
    items ??
    [
      {
        icon: "mail" as const,
        label: emailLabel,
        description: emailDescription,
        value: email,
        href: `mailto:${email}`,
      },
      {
        icon: "map" as const,
        label: officeLabel,
        description: officeDescription,
        value: officeAddress,
        href: "#",
      },
      {
        icon: "phone" as const,
        label: phoneLabel,
        description: phoneDescription,
        value: phone,
        href: `tel:${phone}`,
      },
      {
        icon: "message" as const,
        label: chatLabel,
        description: chatDescription,
        value: chatLink,
        href: "#",
      },
    ];

  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14">
            <h1 className="mb-4 text-4xl font-medium tracking-tight md:text-5xl">
              {title}
            </h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {contactItems.map((item) => {
              const Icon = iconMap[item.icon ?? "message"];
              return (
                <div key={`${item.label}-${item.value}`} className="rounded-xl bg-muted/50 p-8">
                  <Icon className="mb-4 size-5 text-muted-foreground" />
                  <p className="mb-1 font-medium">{item.label}</p>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                  {item.href ? (
                    <a href={item.href} className="break-words hover:underline">
                      {item.value}
                    </a>
                  ) : (
                    <p className="break-words">{item.value}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export { Contact7 };
