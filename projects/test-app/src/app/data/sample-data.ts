export interface SampleData {
  id: number;
  name: string;
  email: string;
  age: number;
  department: string;
  salary: number;
  active: boolean;
  joinDate: string;
}

export function generateSampleData(count: number = 1000): SampleData[] {
  const departments = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations"];
  const names = [
    "John", "Jane", "Bob", "Alice", "Charlie", "Diana", "Eve", "Frank",
    "Grace", "Henry", "Ivy", "Jack", "Kate", "Liam", "Mia", "Noah",
    "Olivia", "Paul", "Quinn", "Rachel", "Sam", "Tina", "Uma", "Victor",
    "Wendy", "Xander", "Yara", "Zoe"
  ];
  const surnames = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
    "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson",
    "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee"
  ];

  const startDate = new Date(2020, 0, 1);
  const endDate = new Date();
  const dateRange = endDate.getTime() - startDate.getTime();
  
  const namesLength = names.length;
  const surnamesLength = surnames.length;
  const departmentsLength = departments.length;

  const data: SampleData[] = new Array(count);
  
  for (let i = 0; i < count; i++) {
    const firstName = names[Math.floor(Math.random() * namesLength)];
    const lastName = surnames[Math.floor(Math.random() * surnamesLength)];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    const age = Math.floor(Math.random() * 40) + 25;
    const department = departments[Math.floor(Math.random() * departmentsLength)];
    const salary = Math.floor(Math.random() * 80000) + 40000;
    const active = Math.random() > 0.2;
    
    const randomDate = new Date(startDate.getTime() + Math.random() * dateRange);
    const joinDate = randomDate.toISOString().split("T")[0];

    data[i] = {
      id: i + 1,
      name,
      email,
      age,
      department,
      salary,
      active,
      joinDate
    };
  }

  return data;
}

