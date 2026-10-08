import React, { useState } from 'react';
import LongformLayout from '../../components/site/LongformLayout';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { siteConfig } from '../../config/site';

const ideaSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  category: z.enum(["Research", "Feature", "Dataset", "Use case"], {
    errorMap: () => ({ message: "Please select a category" })
  }),
  description: z.string().min(20, "Please provide a bit more detail (min 20 chars)"),
  email: z.string().email("Invalid email").optional().or(z.literal(""))
});

export default function Contribute() {
  const [submitStatus, setSubmitStatus] = useState('idle'); // idle | submitting | success | error

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(ideaSchema)
  });

  const onSubmit = async (data) => {
    setSubmitStatus('submitting');
    try {
      // const res = await fetch('/api/ideas', { method: 'POST', body: JSON.stringify(data) });
      // Mock network delay
      await new Promise(r => setTimeout(r, 1000));
      setSubmitStatus('success');
      reset();
    } catch (e) {
      setSubmitStatus('error');
    }
  };

  return (
    <LongformLayout title="Contribute" date="October 2026">
      <p className="text-body-large text-slate mb-12">
        Sanjaya is an open research project. We welcome code, models, datasets, use cases, and hard questions.
      </p>

      <h2 className="text-heading-2 mt-16 mb-8">Ways to contribute</h2>
      <ul className="list-disc pl-6 text-body text-graphite/80 space-y-4 mb-16">
        <li><strong>Code:</strong> Help us optimize the streaming pipeline, improve the frontend, or add ROS 2 integrations. Check the <a href={siteConfig.githubUrl} className="underline hover:text-trace">GitHub repository</a>.</li>
        <li><strong>Models:</strong> Have a faster depth estimator or a better open-vocabulary segmentation model? Let's test it.</li>
        <li><strong>Datasets:</strong> We need challenging monocular video datasets with ground truth trajectories to improve our benchmarks.</li>
        <li><strong>Use cases:</strong> Tell us how you plan to use Sanjaya in the field.</li>
      </ul>

      <h2 className="text-heading-2 mt-16 mb-8">Submit an idea</h2>
      <div className="bg-mist border border-slate/20 rounded-media p-8">
        {submitStatus === 'success' ? (
          <div className="text-center py-8">
            <h3 className="text-heading-3 mb-2 text-graphite">Idea submitted</h3>
            <p className="text-slate">Thank you for sharing your thoughts with us. We'll take a look soon.</p>
            <button onClick={() => setSubmitStatus('idle')} className="mt-6 text-small underline font-medium hover:text-trace">Submit another</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="title" className="text-small font-semibold">Title</label>
              <input 
                id="title" 
                {...register("title")} 
                className="px-4 py-3 rounded-xl border border-slate/30 bg-paper text-graphite focus:outline-none focus:border-trace focus:ring-1 focus:ring-trace" 
                placeholder="Brief summary of your idea" 
              />
              {errors.title && <span className="text-red-500 text-small">{errors.title.message}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="category" className="text-small font-semibold">Category</label>
              <select 
                id="category" 
                {...register("category")} 
                className="px-4 py-3 rounded-xl border border-slate/30 bg-paper text-graphite focus:outline-none focus:border-trace focus:ring-1 focus:ring-trace appearance-none"
              >
                <option value="">Select a category...</option>
                <option value="Research">Research</option>
                <option value="Feature">Feature</option>
                <option value="Dataset">Dataset</option>
                <option value="Use case">Use case</option>
              </select>
              {errors.category && <span className="text-red-500 text-small">{errors.category.message}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="text-small font-semibold">Description</label>
              <textarea 
                id="description" 
                {...register("description")} 
                rows="5"
                className="px-4 py-3 rounded-xl border border-slate/30 bg-paper text-graphite focus:outline-none focus:border-trace focus:ring-1 focus:ring-trace resize-y" 
                placeholder="What is the idea and why does it matter?" 
              />
              {errors.description && <span className="text-red-500 text-small">{errors.description.message}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-small font-semibold">Email (optional)</label>
              <input 
                id="email" 
                type="email"
                {...register("email")} 
                className="px-4 py-3 rounded-xl border border-slate/30 bg-paper text-graphite focus:outline-none focus:border-trace focus:ring-1 focus:ring-trace" 
                placeholder="If you'd like us to reach out" 
              />
              {errors.email && <span className="text-red-500 text-small">{errors.email.message}</span>}
            </div>

            {submitStatus === 'error' && (
              <div className="text-red-500 text-small">Something went wrong. Please try again.</div>
            )}

            <button 
              type="submit" 
              disabled={submitStatus === 'submitting'}
              className="mt-2 bg-trace text-void px-8 py-3 rounded-pill font-semibold text-body hover:bg-trace/90 transition-colors w-max disabled:opacity-50"
            >
              {submitStatus === 'submitting' ? 'Submitting...' : 'Submit idea'}
            </button>
          </form>
        )}
      </div>
    </LongformLayout>
  );
}
