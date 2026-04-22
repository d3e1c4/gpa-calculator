import React, { useState } from 'react';
import { Calculator, Target, Plus, Trash2, GraduationCap } from 'lucide-react';

const gradePoints = {
  'A+': 4.00, 'A': 4.00, 'A-': 3.70,
  'B+': 3.30, 'B': 3.00, 'B-': 2.70,
  'C+': 2.30, 'C': 2.00, 'C-': 1.70,
  'D+': 1.30, 'D': 1.00, 'E': 0.00
};

export default function GPADashboard() {
  const [activeTab, setActiveTab] = useState('calculator');

  // State for Semester GPA Calculator
  const [courses, setCourses] = useState([
    { id: 1, name: 'Module 1', credits: 3, grade: 'A' },
    { id: 2, name: 'Module 2', credits: 3, grade: 'B+' },
    { id: 3, name: 'Module 3', credits: 2, grade: 'A-' }
  ]);

  // State for Target WGPA Calculator
  const [targets, setTargets] = useState({
    y2s1: 3.33, y2s2: 3.75,
    y3s1: 3.75, y3s2: 3.75,
    y4s1: 3.75, y4s2: 3.75
  });

  // Calculate Semester GPA
  const calculateGPA = () => {
    let totalCredits = 0;
    let totalPoints = 0;
    courses.forEach(course => {
      totalCredits += Number(course.credits);
      totalPoints += Number(course.credits) * gradePoints[course.grade];
    });
    return totalCredits === 0 ? 0 : (totalPoints / totalCredits).toFixed(2);
  };

  // Calculate Target WGPA (Y1=0%, Y2=20%, Y3=30%, Y4=50%)
  const calculateWGPA = () => {
    const y2Avg = (Number(targets.y2s1) + Number(targets.y2s2)) / 2;
    const y3Avg = (Number(targets.y3s1) + Number(targets.y3s2)) / 2;
    const y4Avg = (Number(targets.y4s1) + Number(targets.y4s2)) / 2;

    const wgpa = (y2Avg * 0.20) + (y3Avg * 0.30) + (y4Avg * 0.50);
    return wgpa.toFixed(2);
  };

  const handleAddCourse = () => {
    setCourses([...courses, { id: Date.now(), name: '', credits: 3, grade: 'A' }]);
  };

  const handleRemoveCourse = (id) => {
    if (courses.length > 1) {
      setCourses(courses.filter(c => c.id !== id));
    }
  };

  const handleCourseChange = (id, field, value) => {
    setCourses(courses.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleTargetChange = (sem, value) => {
    setTargets({ ...targets, [sem]: value });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center space-x-3 mb-8">
          <GraduationCap className="w-10 h-10 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">University Performance Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 bg-white p-1 rounded-xl shadow-sm w-fit">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'calculator' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Calculator className="w-5 h-5" />
            <span>Semester GPA</span>
          </button>
          <button
            onClick={() => setActiveTab('target')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'target' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Target className="w-5 h-5" />
            <span>WGPA Target</span>
          </button>
        </div>

        {/* Tab 1: Semester GPA Calculator */}
        {activeTab === 'calculator' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Calculate Current Semester GPA</h2>

            <div className="space-y-4 mb-6">
              {courses.map((course, index) => (
                <div key={course.id} className="flex flex-wrap md:flex-nowrap items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <span className="font-semibold text-gray-500 w-6">{index + 1}.</span>
                  <input
                    type="text"
                    placeholder="Module Name (Optional)"
                    value={course.name}
                    onChange={(e) => handleCourseChange(course.id, 'name', e.target.value)}
                    className="flex-1 min-w-[200px] p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 font-medium">Credits:</label>
                    <input
                      type="number"
                      min="1" max="8"
                      value={course.credits}
                      onChange={(e) => handleCourseChange(course.id, 'credits', e.target.value)}
                      className="w-20 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 font-medium">Grade:</label>
                    <select
                      value={course.grade}
                      onChange={(e) => handleCourseChange(course.id, 'grade', e.target.value)}
                      className="w-24 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-700"
                    >
                      {Object.keys(gradePoints).map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleRemoveCourse(course.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove Module"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddCourse}
              className="flex items-center space-x-2 text-blue-600 font-semibold hover:text-blue-800 transition-colors mb-8"
            >
              <Plus className="w-5 h-5" />
              <span>Add Module</span>
            </button>

            <div className="bg-blue-50 rounded-xl p-6 flex flex-col items-center justify-center border border-blue-100">
              <span className="text-gray-600 font-medium mb-1">Your Semester GPA is</span>
              <span className="text-5xl font-extrabold text-blue-700">{calculateGPA()}</span>
            </div>
          </div>
        )}

        {/* Tab 2: WGPA Target Calculator */}
        {activeTab === 'target' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="mb-6 border-b pb-4">
              <h2 className="text-xl font-bold text-gray-800">Degree Class Target Planner</h2>
              <p className="text-gray-500 text-sm mt-1">Adjust your expected GPA for future semesters to see your final WGPA.</p>
              <div className="flex gap-4 mt-3">
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">Year 2: 20%</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">Year 3: 30%</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">Year 4: 50%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Year 2 */}
              <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-700 flex items-center justify-between">
                  <span>Year 2</span> <span className="text-sm font-normal text-gray-500">Weight: 20%</span>
                </h3>
                <div>
                  <label className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                    <span>Semester 1</span> <span>{targets.y2s1}</span>
                  </label>
                  <input type="range" min="2.00" max="4.00" step="0.01" value={targets.y2s1} onChange={(e) => handleTargetChange('y2s1', e.target.value)} className="w-full accent-blue-600" />
                </div>
                <div>
                  <label className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                    <span>Semester 2</span> <span>{targets.y2s2}</span>
                  </label>
                  <input type="range" min="2.00" max="4.00" step="0.01" value={targets.y2s2} onChange={(e) => handleTargetChange('y2s2', e.target.value)} className="w-full accent-blue-600" />
                </div>
              </div>

              {/* Year 3 */}
              <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-700 flex items-center justify-between">
                  <span>Year 3</span> <span className="text-sm font-normal text-gray-500">Weight: 30%</span>
                </h3>
                <div>
                  <label className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                    <span>Semester 1</span> <span>{targets.y3s1}</span>
                  </label>
                  <input type="range" min="2.00" max="4.00" step="0.01" value={targets.y3s1} onChange={(e) => handleTargetChange('y3s1', e.target.value)} className="w-full accent-blue-600" />
                </div>
                <div>
                  <label className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                    <span>Semester 2</span> <span>{targets.y3s2}</span>
                  </label>
                  <input type="range" min="2.00" max="4.00" step="0.01" value={targets.y3s2} onChange={(e) => handleTargetChange('y3s2', e.target.value)} className="w-full accent-blue-600" />
                </div>
              </div>

              {/* Year 4 */}
              <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200 md:col-span-2">
                <h3 className="font-bold text-gray-700 flex items-center justify-between">
                  <span>Year 4</span> <span className="text-sm font-normal text-gray-500">Weight: 50%</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                      <span>Semester 1</span> <span>{targets.y4s1}</span>
                    </label>
                    <input type="range" min="2.00" max="4.00" step="0.01" value={targets.y4s1} onChange={(e) => handleTargetChange('y4s1', e.target.value)} className="w-full accent-blue-600" />
                  </div>
                  <div>
                    <label className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                      <span>Semester 2</span> <span>{targets.y4s2}</span>
                    </label>
                    <input type="range" min="2.00" max="4.00" step="0.01" value={targets.y4s2} onChange={(e) => handleTargetChange('y4s2', e.target.value)} className="w-full accent-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* WGPA Final Result */}
            <div className={`rounded-xl p-8 flex flex-col items-center justify-center border transition-colors ${calculateWGPA() >= 3.70 ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
              <span className="text-gray-600 font-medium mb-2 text-lg">Estimated Final WGPA</span>
              <span className={`text-6xl font-extrabold ${calculateWGPA() >= 3.70 ? 'text-green-700' : 'text-blue-700'}`}>{calculateWGPA()}</span>
              {calculateWGPA() >= 3.70 && (
                <span className="mt-3 bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                  First Class Target Reached!
                </span>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}