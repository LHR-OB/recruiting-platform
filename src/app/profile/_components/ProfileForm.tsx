"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Upload, User, Mail, FileText, PhoneIcon } from "lucide-react";
import type { User as UserType } from "next-auth";
import { updateProfile, uploadResume } from "../actions";
import { UploadButton } from "~/app/people/_components/upload-things";
import Link from "next/link";

interface ProfileFormProps {
  user: UserType & {
    phoneNumber?: string | null;
  };
  resumeUrl?: string | null;
}

export function ProfileForm({ user, resumeUrl }: ProfileFormProps) {
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [number, setNumber] = useState(user.phoneNumber ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [resumeFile, setResumeFile] = useState<string | null>(
    resumeUrl ?? null,
  );

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phoneNumber", number);

      await updateProfile(formData);
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert(
        error instanceof Error ? error.message : "Failed to update profile",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pt-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="mt-1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">EID Email Address</Label>
            <div className="relative mt-1">
              <Mail className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Phone Number</Label>
            <div className="relative mt-1">
              <PhoneIcon className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
              <Input
                id="phone"
                type="tel"
                placeholder="e.g., 123-456-7890"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resume Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="resume">Upload Resume</Label>
            <UploadButton
              endpoint="resumeUploader"
              onClientUploadComplete={(file) => {
                if (file && file.length > 0) {
                  setResumeFile(file[0]!.ufsUrl);
                }
              }}
            />
          </div>

          {resumeFile && (
            <div className="bg-muted flex items-center justify-between rounded-md p-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <Link href={resumeFile}>Current Resume</Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
