"use client";
import { Search, Plus, Filter } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shadcn/components/ui/avatar";
import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shadcn/components/ui/card";
import { from, gql, useQuery } from "@apollo/client";
import React from "react";
import { Separator } from "@/shadcn/components/ui/separator";
import { Input } from "@/shadcn/components/ui/input";
import ForumPostMap from "./components/ForumPostMap";

const GET_PUBLISHED_LAYERS = gql`
  query GetPublishedLayers {
    publishedLayers {
      id
      name
      type
      geography
    }
  }
`;

export default function Page() {
  const { data, loading, error } = useQuery(GET_PUBLISHED_LAYERS);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-5xl font-light tracking-tighter">Forum</h1>
            <p className="text-muted-foreground">
              Join discussions and share your thoughts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search discussions..."
                className="w-full pl-8"
              />
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </div>
        </header>
        <Separator />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Categories</h3>
                <div className="w-full">
                  <Button
                    variant="outline"
                    className="w-full justify-start mb-1"
                  >
                    All
                  </Button>
                  <Button variant="ghost" className="w-full justify-start mb-1">
                    Turf
                  </Button>
                  <Button variant="ghost" className="w-full justify-start mb-1">
                    Events
                  </Button>
                  <Button variant="ghost" className="w-full justify-start mb-1">
                    Locations
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">nextjs</Badge>
                  <Badge variant="secondary">react</Badge>
                  <Badge variant="secondary">tailwind</Badge>
                  <Badge variant="secondary">components</Badge>
                  <Badge variant="secondary">beginner</Badge>
                </div>
              </div>

              <Separator className="md:hidden" />
            </div>
          </div>

          <div className="md:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Discussions</h2>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>

            <div className="space-y-4">
              {[...data?.publishedLayers]
                .sort((a, b) => b.id - a.id)
                .map((layer: any) => (
                  <Card key={layer.id} className=" shadow-none">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="">
                            <div className="flex items-center gap-2 mb-4 font-normal">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src="avatar: /placeholder.svg?height=40&width=40"
                                  alt={layer.name}
                                />
                                <AvatarFallback>
                                  {layer.name
                                    .split(" ")
                                    .map((word: string) => word[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>

                              <div>
                                <p className="text-sm font-medium">
                                  {layer.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  5 minutes ago
                                </p>
                              </div>
                            </div>
                            <p className=" ">
                              We're looking to do some door knocking this
                              weekend. Sun will be out, anyone interested in
                              joining?
                            </p>
                          </CardTitle>
                          <CardDescription className="mt-2"></CardDescription>
                        </div>
                        <Badge>{layer.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ForumPostMap
                        features={{
                          type: "FeatureCollection",
                          features: [
                            {
                              type: "Feature",
                              geometry: layer.geography,
                              properties: {
                                name: layer.name,
                              },
                            },
                          ],
                        }}
                      />
                    </CardContent>
                    <CardFooter className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div>24 replies</div>
                        <div>134 views</div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              {forumPosts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg hover:text-primary hover:underline">
                          <a href={`#post-${post.id}`}>{post.title}</a>
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {post.excerpt}
                        </CardDescription>
                      </div>
                      <Badge>{post.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent></CardContent>
                  <CardFooter className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={post.author.avatar}
                          alt={post.author.name}
                        />
                        <AvatarFallback>{post.author.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {post.author.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {post.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div>{post.replies} replies</div>
                      <div>{post.views} views</div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sample forum data
const forumPosts = [
  {
    id: 1,
    title: "Getting started with shadcn/ui components",
    excerpt:
      "I'm new to shadcn/ui and I'm trying to understand how to use the components effectively. Any tips?",
    author: {
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "SJ",
    },
    category: "Help",
    replies: 12,
    views: 340,
    date: "2 hours ago",
    tags: ["beginner", "components"],
  },
  {
    id: 2,
    title: "Best practices for responsive design with Tailwind",
    excerpt:
      "I'm working on a project that needs to be fully responsive. What are some best practices when using Tailwind CSS?",
    author: {
      name: "Mike Chen",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "MC",
    },
    category: "Discussion",
    replies: 8,
    views: 215,
    date: "5 hours ago",
    tags: ["tailwind", "responsive"],
  },
  {
    id: 3,
    title: "Server Components vs. Client Components",
    excerpt:
      "When should I use Server Components and when should I use Client Components in my Next.js application?",
    author: {
      name: "Alex Rivera",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "AR",
    },
    category: "Discussion",
    replies: 23,
    views: 512,
    date: "1 day ago",
    tags: ["nextjs", "react"],
  },
  {
    id: 4,
    title: "Announcing our new UI library integration",
    excerpt:
      "We're excited to announce that we've integrated shadcn/ui into our product. Here's what you need to know.",
    author: {
      name: "Taylor Kim",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "TK",
    },
    category: "Announcement",
    replies: 5,
    views: 189,
    date: "2 days ago",
    tags: ["announcement", "update"],
  },
];
