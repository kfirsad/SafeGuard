import { motion } from "framer-motion";
import { FileText, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  {
    id: "report",
    label: "New Report",
    icon: FileText,
    path: "/report",
    color: "from-primary/20 to-accent/20",
  },
  {
    id: "chat",
    label: "Active Chat",
    icon: MessageSquare,
    path: "/chat",
    color: "from-success/20 to-success/10",
  },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-4">
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + index * 0.1 }}
          onClick={() => navigate(action.path)}
          className={`glass-card p-5 flex flex-col items-center gap-3 hover:bg-card/80 transition-all duration-200 group bg-gradient-to-br ${action.color}`}
        >
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-secondary/80 transition-colors">
            <action.icon className="w-6 h-6 text-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground">{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default QuickActions;
