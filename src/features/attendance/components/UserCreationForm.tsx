import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { userService, type CreateUserInput, type CreatedUser } from "../services/userService";

interface UserCreationFormProps {
  onUserCreated?: (user: CreatedUser) => void;
}

export const UserCreationForm = ({ onUserCreated }: UserCreationFormProps) => {
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"doctor" | "student">("student");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const input: CreateUserInput = {
      name: name.trim(),
      email: email.trim(),
      password,
      role,
    };

    const result = await userService.createUser(input);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "فشل إنشاء المستخدم",
        description: result.error,
      });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: "تم إنشاء المستخدم بنجاح",
      description: `تم إنشاء حساب ${role === "doctor" ? "الدكتور" : "الطالب"} ${name} بنجاح.`,
    });

    setName("");
    setEmail("");
    setPassword("");
    setRole("student");
    setIsSubmitting(false);

    if (onUserCreated && result.data) {
      onUserCreated(result.data);
    }
  };

  return (
    <Card className="border-primary/30 bg-card/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          إنشاء مستخدم جديد
        </CardTitle>
        <CardDescription>
          إنشاء حساب جديد للدكاترة أو الطلاب في نظام الحضور.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="user-name">الاسم</Label>
            <Input
              id="user-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل الاسم الكامل"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-email">البريد الإلكتروني</Label>
            <Input
              id="user-email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@university.edu"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-password">كلمة المرور</Label>
            <Input
              id="user-password"
              type="password"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6 أحرف على الأقل"
              required
              minLength={6}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-role">الدور</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as "doctor" | "student")}
              disabled={isSubmitting}
            >
              <SelectTrigger id="user-role">
                <SelectValue placeholder="اختر الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">دكتور</SelectItem>
                <SelectItem value="student">طالب</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            <span>{isSubmitting ? "جارٍ الإنشاء..." : "إنشاء المستخدم"}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
