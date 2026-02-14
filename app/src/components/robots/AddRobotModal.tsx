import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { RobotFormData } from "@/lib/types/RobotTypes";

type AddRobotModalProps = {
  onAdd: (robot: RobotFormData) => void;
};

export function AddRobotModal({ onAdd }: AddRobotModalProps) {
  const [open, setOpen] = useState(false);
  
  const [formData, setFormData] = useState<RobotFormData | null>(null);

  const isAddDisabled = !formData?.serial_number || !formData?.name;

  const handleAdd = () => {
    if (formData) {
      onAdd(formData);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="p-4">
            <Button
              variant="outline"
              className="w-full h-10 rounded-lg border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-medium"
            >
              Add Robot
            </Button>
          </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Robot</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-1">
            <Label htmlFor="robot-name">Serial Number</Label>
            <Input
              id="robot-serial-number"
              value={formData?.serial_number || ""}
              onChange={(e) => setFormData({...formData as RobotFormData, serial_number: e.target.value})}
              placeholder="Enter serial number"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="robot-name">Robot Name</Label>
            <Input
              id="robot-name"
              value={formData?.name || ""}
              onChange={(e) => setFormData({...formData as RobotFormData, name: e.target.value})}
              placeholder="Enter robot name"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => {setOpen(false); setFormData(null)}} className="mr-2">
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={isAddDisabled}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
