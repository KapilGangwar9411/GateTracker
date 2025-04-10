import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useLectureMutations } from './hooks/useLectureMutations';
import { Subject } from '@/types/database.types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Save, FileDown, Book } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

interface SubjectTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
}

interface TemplateItem {
  title: string;
  description?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  items: TemplateItem[];
}

// Predefined GATE subject templates
const PREDEFINED_TEMPLATES: Record<string, Template> = {
  'dsa': {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    description: 'Standard GATE DSA curriculum',
    items: [
      { title: 'Arrays and Strings', description: 'Basic operations, time complexity, special algorithms' },
      { title: 'Linked Lists', description: 'Singly, doubly linked lists, operations' },
      { title: 'Stacks and Queues', description: 'Implementation, applications, priority queues' },
      { title: 'Trees', description: 'Binary trees, BST, AVL trees, Red-Black trees' },
      { title: 'Graphs', description: 'Representation, traversal algorithms, shortest paths' },
      { title: 'Sorting Algorithms', description: 'Bubble, insertion, selection, merge, quick, heap sort' },
      { title: 'Searching Algorithms', description: 'Linear, binary search, hashing' },
      { title: 'Dynamic Programming', description: 'Top-down, bottom-up approaches, memoization' },
      { title: 'Greedy Algorithms', description: 'Activity selection, Huffman coding' },
      { title: 'Advanced Data Structures', description: 'B-trees, tries, segment trees' }
    ]
  },
  'os': {
    id: 'os',
    name: 'Operating Systems',
    description: 'Core OS concepts for GATE',
    items: [
      { title: 'Process Management', description: 'Process states, PCB, context switching' },
      { title: 'CPU Scheduling', description: 'Scheduling algorithms, performance criteria' },
      { title: 'Memory Management', description: 'Virtual memory, paging, segmentation' },
      { title: 'File Systems', description: 'File allocation methods, directory structures' },
      { title: 'I/O Systems', description: 'Devices, drivers, I/O scheduling' },
      { title: 'Deadlocks', description: 'Prevention, avoidance, detection, recovery' },
      { title: 'Synchronization', description: 'Semaphores, monitors, message passing' },
      { title: 'Protection & Security', description: 'Access control, authentication' }
    ]
  },
  'dbms': {
    id: 'dbms',
    name: 'Database Management Systems',
    description: 'Essential database concepts',
    items: [
      { title: 'ER Model', description: 'Entity, attributes, relationships, cardinality' },
      { title: 'Relational Model', description: 'Relations, keys, constraints' },
      { title: 'SQL', description: 'DDL, DML, DCL, queries, functions' },
      { title: 'Normalization', description: '1NF, 2NF, 3NF, BCNF, higher forms' },
      { title: 'Transaction Management', description: 'ACID properties, concurrency control' },
      { title: 'Indexing', description: 'B-trees, hashing, clustered indexes' },
      { title: 'Query Processing', description: 'Query optimization, execution plans' },
      { title: 'NoSQL Databases', description: 'Document, key-value, column stores' }
    ]
  },
  'cn': {
    id: 'cn',
    name: 'Computer Networks',
    description: 'Networking fundamentals',
    items: [
      { title: 'OSI Model', description: 'Layers, protocols, interfaces' },
      { title: 'TCP/IP Protocol Stack', description: 'Protocols at each layer' },
      { title: 'Physical Layer', description: 'Transmission media, encoding, modulation' },
      { title: 'Data Link Layer', description: 'Framing, error control, flow control' },
      { title: 'Network Layer', description: 'IP, routing algorithms, congestion control' },
      { title: 'Transport Layer', description: 'TCP, UDP, connection management' },
      { title: 'Application Layer', description: 'DNS, HTTP, SMTP, FTP' },
      { title: 'Network Security', description: 'Encryption, authentication, firewalls' }
    ]
  },
  'toc': {
    id: 'toc',
    name: 'Theory of Computation',
    description: 'Automata theory and formal languages',
    items: [
      { title: 'Finite Automata', description: 'DFA, NFA, equivalence, minimization' },
      { title: 'Regular Languages', description: 'Regular expressions, pumping lemma' },
      { title: 'Context-Free Grammars', description: 'Derivations, parse trees' },
      { title: 'Pushdown Automata', description: 'Configuration, acceptance' },
      { title: 'Turing Machines', description: 'Models, languages, programming' },
      { title: 'Undecidability', description: 'Halting problem, reductions' },
      { title: 'Complexity Theory', description: 'P, NP, NP-completeness' }
    ]
  }
};

const SubjectTemplateDialog = ({ open, onOpenChange, subjects }: SubjectTemplateDialogProps) => {
  const [activeTab, setActiveTab] = useState<'predefined' | 'custom'>('predefined');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [customTemplateName, setCustomTemplateName] = useState('');
  const [customTemplateDescription, setCustomTemplateDescription] = useState('');
  const [customTemplateItems, setCustomTemplateItems] = useState<TemplateItem[]>([
    { title: '', description: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createLecture } = useLectureMutations();
  
  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      // Keep default state when opening
    } else {
      // Reset state when closing
      setSelectedTemplate(null);
      setSelectedSubjectId('');
      setCustomTemplateName('');
      setCustomTemplateDescription('');
      setCustomTemplateItems([{ title: '', description: '' }]);
    }
  }, [open]);
  
  // Handle subject selection
  const handleSubjectChange = (value: string) => {
    setSelectedSubjectId(value);
  };
  
  // Handle adding a new item to custom template
  const handleAddItem = () => {
    setCustomTemplateItems([...customTemplateItems, { title: '', description: '' }]);
  };
  
  // Handle updating custom template item
  const handleUpdateItem = (index: number, field: 'title' | 'description', value: string) => {
    const updatedItems = [...customTemplateItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setCustomTemplateItems(updatedItems);
  };
  
  // Handle removing an item from custom template
  const handleRemoveItem = (index: number) => {
    if (customTemplateItems.length > 1) {
      const updatedItems = [...customTemplateItems];
      updatedItems.splice(index, 1);
      setCustomTemplateItems(updatedItems);
    }
  };
  
  // Export template to JSON file
  const handleExportTemplate = () => {
    let templateToExport: Template;
    
    if (activeTab === 'predefined' && selectedTemplate) {
      templateToExport = selectedTemplate;
    } else {
      // Validate custom template
      if (!customTemplateName.trim()) {
        toast.error('Please provide a template name');
        return;
      }
      
      if (customTemplateItems.some(item => !item.title.trim())) {
        toast.error('All lecture titles must be filled');
        return;
      }
      
      templateToExport = {
        id: 'custom_' + Date.now(),
        name: customTemplateName,
        description: customTemplateDescription,
        items: customTemplateItems.filter(item => item.title.trim()),
      };
    }
    
    // Create downloadable JSON file
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(templateToExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${templateToExport.name.replace(/\s+/g, '_').toLowerCase()}_template.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    toast.success('Template exported successfully');
  };
  
  // Apply selected template to create lectures
  const handleApplyTemplate = async () => {
    if (!selectedSubjectId) {
      toast.error('Please select a subject');
      return;
    }
    
    let templateToApply: Template | null = null;
    
    if (activeTab === 'predefined') {
      if (!selectedTemplate) {
        toast.error('Please select a template');
        return;
      }
      templateToApply = selectedTemplate;
    } else {
      // Validate custom template
      if (!customTemplateName.trim()) {
        toast.error('Please provide a template name');
        return;
      }
      
      if (customTemplateItems.some(item => !item.title.trim())) {
        toast.error('All lecture titles must be filled');
        return;
      }
      
      templateToApply = {
        id: 'custom_' + Date.now(),
        name: customTemplateName,
        description: customTemplateDescription,
        items: customTemplateItems.filter(item => item.title.trim()),
      };
    }
    
    if (!templateToApply) {
      toast.error('No valid template selected');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
      
      // Create each lecture in sequence
      for (const item of templateToApply.items) {
        await createLecture.mutateAsync({
          title: item.title,
          description: item.description || '',
          subject_id: selectedSubjectId,
          status: 'not_started'
        });
      }
      
      toast.success(`Successfully applied template: ${templateToApply.items.length} lectures created`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to apply template');
      console.error('Template application error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <DialogContent className="sm:max-w-[700px]">
      <DialogHeader>
        <DialogTitle>Subject Templates</DialogTitle>
        <DialogDescription>
          Apply standard GATE curriculum templates or create your own custom lecture sets
        </DialogDescription>
      </DialogHeader>
      
      <div className="py-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Target Subject</Label>
          <Select value={selectedSubjectId} onValueChange={handleSubjectChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'predefined' | 'custom')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="predefined">
              <Book className="h-4 w-4 mr-2" />
              Predefined Templates
            </TabsTrigger>
            <TabsTrigger value="custom">
              <Plus className="h-4 w-4 mr-2" />
              Custom Template
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="predefined" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(PREDEFINED_TEMPLATES).map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer hover:border-primary transition-colors ${
                    selectedTemplate?.id === template.id ? 'border-primary' : ''
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">{template.name}</CardTitle>
                    <CardDescription className="text-xs">{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-xs text-muted-foreground">
                      {template.items.length} lectures included
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTemplate(template);
                        handleExportTemplate();
                      }}
                    >
                      <FileDown className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {selectedTemplate && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Template Preview: {selectedTemplate.name}</h4>
                <ScrollArea className="h-[200px] rounded-md border p-2">
                  <div className="space-y-2">
                    {selectedTemplate.items.map((item, index) => (
                      <div key={index} className="py-1 px-2 rounded hover:bg-muted">
                        <p className="font-medium text-sm">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="custom" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    value={customTemplateName}
                    onChange={(e) => setCustomTemplateName(e.target.value)}
                    placeholder="e.g., Computer Graphics Fundamentals"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateDescription">Description (Optional)</Label>
                  <Input
                    id="templateDescription"
                    value={customTemplateDescription}
                    onChange={(e) => setCustomTemplateDescription(e.target.value)}
                    placeholder="Brief description of this template"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Lecture Items</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddItem}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                <ScrollArea className="h-[250px] rounded-md border p-3">
                  <div className="space-y-4">
                    {customTemplateItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 gap-2 pb-4 border-b">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Lecture title"
                            value={item.title}
                            onChange={(e) => handleUpdateItem(index, 'title', e.target.value)}
                            className="flex-1"
                          />
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            disabled={customTemplateItems.length <= 1}
                          >
                            ✕
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Description (optional)"
                          value={item.description || ''}
                          onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                          className="text-sm"
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportTemplate}
                className="w-full text-xs"
              >
                <Save className="h-3.5 w-3.5 mr-2" />
                Save Template as JSON File
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleApplyTemplate} disabled={isSubmitting}>
          {isSubmitting ? 'Creating Lectures...' : 'Apply Template'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default SubjectTemplateDialog; 