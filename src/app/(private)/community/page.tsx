"use client";

import {
  Bookmark,
  Calendar,
  Component,
  Eye,
  Filter,
  MessageCircle,
  Plus,
  Search,
  Share2,
  ThumbsUp,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Badge } from "@/shadcn/ui/badge";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";

export default function CommunityPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedTab] = useState("all");

  const filteredData = useMemo(() => {
    return dummyData.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === "all" || item.type === selectedType;
      const matchesTab =
        selectedTab === "all" ||
        (selectedTab === "events" && item.type === "Marker") ||
        (selectedTab === "areas" && item.type === "Area") ||
        (selectedTab === "libraries" && item.type === "Data Library");

      return matchesSearch && matchesType && matchesTab;
    });
  }, [searchQuery, selectedType, selectedTab]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Community Forum" />

      {/* Search and Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search posts, events, or members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedType === "all" ? "default" : "secondary"}
          className="cursor-pointer hover:bg-primary/80"
          onClick={() => setSelectedType("all")}
        >
          All Types
        </Badge>
        {dummyTypes.map((type) => (
          <Badge
            key={type.id}
            variant={selectedType === type.name ? "default" : "secondary"}
            className="cursor-pointer hover:bg-primary/80"
            onClick={() => setSelectedType(type.name)}
          >
            {type.name}
          </Badge>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <div className="space-y-4">
            {filteredData.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 shadow-none ">
                  <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No posts found
                  </h3>
                  <p className="text-gray-500 text-center">
                    Try adjusting your search or filters to find what
                    you&apos;re looking for.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredData.map((item) => (
                <Card
                  key={item.id}
                  className=" shadow-none hover:shadow-lg transition-shadow cursor-pointer p-0 overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className="flex ">
                      {/* Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-72 h-72 object-cover "
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 p-5 flex flex-col">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {item.type}
                            </Badge>
                            {item.type === "Marker" && (
                              <Badge variant="secondary" className="text-xs">
                                Event
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <Bookmark className="h-4 w-4 cursor-pointer hover:text-blue-500" />
                            <Share2 className="h-4 w-4 cursor-pointer hover:text-green-500" />
                          </div>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {item.title}
                        </h3>

                        <p className="text-gray-600 mb-3 line-clamp-2 flex-1">
                          {item.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {item.author}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(item.createdAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              {Math.floor(Math.random() * 20) + 1}
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {Math.floor(Math.random() * 100) + 10}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3"
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              {Math.floor(Math.random() * 15) + 1}
                            </Button>
                            <Button variant="outline" size="sm" className="h-8">
                              Reply
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className=" shadow-none gap-3">
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Posts</span>
                <span className="font-medium">{dummyData.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Members</span>
                <span className="font-medium">24</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">This Week</span>
                <span className="font-medium">8</span>
              </div>
            </CardContent>
          </Card>
          <Card className="mt-4 shadow-none gap-3">
            <CardHeader>
              <CardTitle className="text-lg">Top contributors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm text-gray-600">John Doe</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm text-gray-600">Jane Doe</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm text-gray-600">Alex Smith</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm text-gray-600">Sarah Wilson</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="mt-4 shadow-none gap-3">
            <CardHeader>
              <CardTitle className="text-lg">Organisations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Component className="h-4 w-4" />
                  <span className="text-sm text-gray-600">Green Peace UK</span>
                </div>
                <div className="flex items-center gap-2">
                  <Component className="h-4 w-4" />
                  <span className="text-sm text-gray-600">Hope not Hate</span>
                </div>
                <div className="flex items-center gap-2">
                  <Component className="h-4 w-4" />
                  <span className="text-sm text-gray-600">Pomoc</span>
                </div>
                <div className="flex items-center gap-2">
                  <Component className="h-4 w-4" />
                  <span className="text-sm text-gray-600">The Green Party</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const dummyData = [
  {
    id: 1,
    title: "Pelican House Event: New UK left party",
    author: "John Doe",
    description:
      "Event happening here this weekend, come join us! We'll be discussing the future of progressive politics in the UK and building connections with local activists.",
    createdAt: new Date("2024-01-15"),
    image: "/screenshot-1.png",
    type: "Marker",
  },
  {
    id: 2,
    title: "Canvassing in the local area",
    author: "Jane Doe",
    description:
      "We&apos;re canvassing in the local area, come join us! This is a great opportunity to connect with voters and understand local concerns.",
    createdAt: new Date("2024-01-12"),
    image: "/screenshot-2.png",
    type: "Area",
  },
  {
    id: 3,
    title: "Game Developer Studios in Scotland",
    author: "Alex Smith",
    description:
      "A comprehensive collection of game developer studios in Scotland. Perfect for networking and collaboration opportunities.",
    createdAt: new Date("2024-01-10"),
    image: "/screenshot-3.png",
    type: "Data Library",
  },
  {
    id: 4,
    title: "Community Garden Initiative",
    author: "Sarah Wilson",
    description:
      "Starting a new community garden project in the city center. Looking for volunteers and supporters to help make this green space a reality.",
    createdAt: new Date("2024-01-08"),
    image: "/screenshot-1.png",
    type: "Area",
  },
  {
    id: 5,
    title: "Tech Meetup: AI and Democracy",
    author: "Mike Johnson",
    description:
      "Join us for an evening discussing how artificial intelligence can impact democratic processes and civic engagement.",
    createdAt: new Date("2024-01-05"),
    image: "/screenshot-2.png",
    type: "Marker",
  },
  {
    id: 6,
    title: "Local Business Directory",
    author: "Emma Davis",
    description:
      "A curated directory of local businesses supporting sustainable practices and community development.",
    createdAt: new Date("2024-01-03"),
    image: "/screenshot-3.png",
    type: "Data Library",
  },
];

const dummyTypes = [
  {
    id: 1,
    name: "Marker",
  },
  {
    id: 2,
    name: "Area",
  },
  {
    id: 3,
    name: "Data Library",
  },
];
