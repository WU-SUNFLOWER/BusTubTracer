const fake_data = {
        "tag": "Projection",
        "attr": {
            "exprs": ["#0.0", "#0.1", "#0.2", "#0.3"]
        },
        "children": [
            {
                "tag": "Filter",
                "attr": {
                    "predicate": ["(#0.0=#0.2)"]
                },
                "children": [
                    {
                        "tag": "NestedLoopJoin",
                        "attr": {
                            "type": "Inner",
                            "predicate": true                        
                        },
                        "children": [
                            {
                                "tag": "MockScan",
                                "attr": {
                                    "table": "__mock_table_1"
                                },
                                "children": []
                            },
                            {
                                "tag": "MockScan",
                                "attr": {
                                    "table": "__mock_table_3"
                                }
                            },
                        ]
                    }
                ]
            }
        ]
    };

const tableData = {
    "__mock_table_1": [
        { "Field": "colA", "Type": "Int" },
        { "Field": "colB", "Type": "Int" }
    ],
    "__mock_table_3": [
        { "Field": "colE", "Type": "Int" },
        { "Field": "colF", "Type": "Int" }
    ]
};

function Init() {
    // 创建一个 SVG 元素并初始化数据
    const svg = d3.select("#viewer-wrapper").append("svg").attr("width", 1920).attr("height", 1080);
    const data = fake_data;


    const root = d3.hierarchy(data);
    const treeLayout = d3.tree().size([500, 500]);
    treeLayout(root);

    // 绘制节点和连接线
    svg.selectAll("line")
      .data(root.links())
      .enter()
      .append("line")
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y + 25)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y + 25)
      .attr("stroke", "black");


    svg.selectAll("circle")
      .data(root.descendants())
      .enter()
      .append("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y + 25)
      .attr("r", 20)
      .attr("fill", "lightblue")
      .attr("node-attr", d => {
        return JSON.stringify({
                'tag': d.data.tag,
                'attr': d.data.attr
               });
      })
      .on("click", function () {
        UpdateInspector(JSON.parse(this.getAttribute("node-attr")));
      });

    svg.selectAll("text")
      .data(root.descendants())
      .enter()
      .append("text")
      .attr("x", d => d.x)
      .attr("y", d => d.y + 25)  // 将文本位置稍微向上移动
      .attr("text-anchor", "middle")
      .text(d => d.data.tag);
      
// 在 MockScan 节点之后添加表格
root.descendants().forEach(d => {
    if (d.data.tag === "MockScan" && tableData[d.data.attr.table]) {
        // 在 MockScan 节点下方添加表格
        svg.selectAll("table")
            .data([d])
            .enter()
            .append("foreignObject")
            .attr("x", d.x - 50) // 设置表格位置
            .attr("y", d.y + 50) // 表格在 MockScan 节点下方
            .attr("width", 100)
            .attr("height", 60)
            .append("xhtml:table")
            .html(() => {
                const rows = tableData[d.data.attr.table]
                    .map(row => `<tr><td>${row.Field}</td><td>${row.Type}</td></tr>`)
                    .join("");
                return `<table border="1"><tr><th>Field</th><th>Type</th></tr>${rows}</table>`;
            });
    }
});
  
    
   InitViewer();
}

function InitViewer() {
    const viewer_elem = document.querySelector("#viewer-wrapper");
    const svg_elem = viewer_elem.querySelector("svg");
    
    let is_moving = false;
    let last_mouse_left = 0;
    let last_mouse_top = 0;
    
    let base_left = viewer_elem.getBoundingClientRect().left;
    let base_top = viewer_elem.getBoundingClientRect().top;
    
    viewer_elem.onmousedown = (event) => {
        is_moving = true;
        last_mouse_left = event.clientX;
        last_mouse_top = event.clienY;
    };
    viewer_elem.onmousemove = (event) => {
        if (is_moving) {
            let cur_svg_left = svg_elem.getBoundingClientRect().left;
            let cur_svg_top = svg_elem.getBoundingClientRect().top;
            
            svg_elem.style.left = cur_svg_left - base_left + event.clientX - last_mouse_left + 'px';
            svg_elem.style.top = cur_svg_top - base_top + event.clientY - last_mouse_top + 'px';
            last_mouse_left = event.clientX;
            last_mouse_top = event.clientY;
        }
    };
    viewer_elem.onmouseup = (event) => {
        if (is_moving) {
            is_moving = false;
        }
    };
}

function UpdateInspector(data) {
    const node_tag_elem = document.querySelector("#inspector-wrapper #node-tag");
    const node_attrs_elem = document.querySelector("#inspector-wrapper #node-attrs");
    
    node_tag_elem.innerText = data.tag;
    
    let attrs_html = "";
    for (let key in data.attr) {
        attrs_html += `<li><span class="attr-name">${key}</span><span class="attr-value">${data.attr[key]}</span></li>`;
    }
    node_attrs_elem.innerHTML = attrs_html;
    
    
}