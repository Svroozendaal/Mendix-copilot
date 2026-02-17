using System.ComponentModel;
using System.Drawing;
using System.Windows.Forms;

namespace AutoCommitMessage;

partial class ChangesPanel
{
    private IContainer components = null!;

    private Panel pnlTop = null!;
    private Label lblBranch = null!;
    private Button btnRefresh = null!;
    private SplitContainer splitContainer = null!;
    private SplitContainer splitLeft = null!;
    private ListView lvChanges = null!;
    private ColumnHeader colName = null!;
    private ColumnHeader colPath = null!;
    private ColumnHeader colStatus = null!;
    private ColumnHeader colStaged = null!;
    private Panel pnlModelHeader = null!;
    private Label lblModelChanges = null!;
    private TreeView treeModelChanges = null!;
    private RichTextBox rtbDiff = null!;
    private Label lblStatus = null!;

    /// <inheritdoc />
    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            components?.Dispose();
        }

        base.Dispose(disposing);
    }

    private void InitializeComponent()
    {
        components = new Container();
        pnlTop = new Panel();
        lblBranch = new Label();
        btnRefresh = new Button();
        splitContainer = new SplitContainer();
        splitLeft = new SplitContainer();
        lvChanges = new ListView();
        colName = new ColumnHeader();
        colPath = new ColumnHeader();
        colStatus = new ColumnHeader();
        colStaged = new ColumnHeader();
        pnlModelHeader = new Panel();
        lblModelChanges = new Label();
        treeModelChanges = new TreeView();
        rtbDiff = new RichTextBox();
        lblStatus = new Label();

        pnlTop.SuspendLayout();
        ((ISupportInitialize)splitContainer).BeginInit();
        splitContainer.Panel1.SuspendLayout();
        splitContainer.Panel2.SuspendLayout();
        splitContainer.SuspendLayout();
        ((ISupportInitialize)splitLeft).BeginInit();
        splitLeft.Panel1.SuspendLayout();
        splitLeft.Panel2.SuspendLayout();
        splitLeft.SuspendLayout();
        pnlModelHeader.SuspendLayout();
        SuspendLayout();

        // pnlTop
        pnlTop.Controls.Add(lblBranch);
        pnlTop.Controls.Add(btnRefresh);
        pnlTop.Dock = DockStyle.Top;
        pnlTop.Height = 36;
        pnlTop.Padding = new Padding(8, 6, 8, 6);
        pnlTop.Name = "pnlTop";

        // lblBranch
        lblBranch.AutoEllipsis = true;
        lblBranch.AutoSize = false;
        lblBranch.Dock = DockStyle.Fill;
        lblBranch.TextAlign = ContentAlignment.MiddleLeft;
        lblBranch.Name = "lblBranch";
        lblBranch.Text = string.Empty;

        // btnRefresh
        btnRefresh.Dock = DockStyle.Right;
        btnRefresh.Width = 100;
        btnRefresh.Text = "Refresh";
        btnRefresh.Name = "btnRefresh";
        btnRefresh.Click += btnRefresh_Click;

        // splitContainer
        splitContainer.Dock = DockStyle.Fill;
        splitContainer.Name = "splitContainer";
        splitContainer.Orientation = Orientation.Vertical;
        splitContainer.Panel1MinSize = 320;
        splitContainer.Panel2MinSize = 180;
        splitContainer.SplitterDistance = 690;

        // splitLeft
        splitLeft.Dock = DockStyle.Fill;
        splitLeft.Name = "splitLeft";
        splitLeft.Orientation = Orientation.Horizontal;
        splitLeft.Panel1MinSize = 120;
        splitLeft.Panel2MinSize = 220;
        splitLeft.SplitterDistance = 170;

        // lvChanges
        lvChanges.Columns.AddRange(new[] { colName, colPath, colStatus, colStaged });
        lvChanges.Dock = DockStyle.Fill;
        lvChanges.FullRowSelect = true;
        lvChanges.GridLines = true;
        lvChanges.HideSelection = false;
        lvChanges.MultiSelect = false;
        lvChanges.View = View.Details;
        lvChanges.Name = "lvChanges";
        lvChanges.SelectedIndexChanged += lvChanges_SelectedIndexChanged;

        // columns
        colName.Text = "Name";
        colName.Width = 180;
        colPath.Text = "Path";
        colPath.Width = 200;
        colStatus.Text = "Status";
        colStatus.Width = 90;
        colStaged.Text = "Staged";
        colStaged.Width = 80;

        // pnlModelHeader
        pnlModelHeader.Controls.Add(lblModelChanges);
        pnlModelHeader.Dock = DockStyle.Top;
        pnlModelHeader.Height = 24;
        pnlModelHeader.Padding = new Padding(6, 4, 6, 2);
        pnlModelHeader.Name = "pnlModelHeader";

        // lblModelChanges
        lblModelChanges.Dock = DockStyle.Fill;
        lblModelChanges.Text = "Model changes (.mpr)";
        lblModelChanges.TextAlign = ContentAlignment.MiddleLeft;
        lblModelChanges.Name = "lblModelChanges";

        // treeModelChanges
        treeModelChanges.Dock = DockStyle.Fill;
        treeModelChanges.HideSelection = false;
        treeModelChanges.Name = "treeModelChanges";

        // rtbDiff
        rtbDiff.Dock = DockStyle.Fill;
        rtbDiff.ReadOnly = true;
        rtbDiff.WordWrap = false;
        rtbDiff.Font = new Font("Courier New", 9F, FontStyle.Regular, GraphicsUnit.Point);
        rtbDiff.Name = "rtbDiff";

        // lblStatus
        lblStatus.Dock = DockStyle.Bottom;
        lblStatus.Height = 22;
        lblStatus.Padding = new Padding(8, 0, 8, 0);
        lblStatus.TextAlign = ContentAlignment.MiddleLeft;
        lblStatus.Name = "lblStatus";
        lblStatus.Text = "Ready";

        splitLeft.Panel1.Controls.Add(lvChanges);
        splitLeft.Panel2.Controls.Add(treeModelChanges);
        splitLeft.Panel2.Controls.Add(pnlModelHeader);

        splitContainer.Panel1.Controls.Add(splitLeft);
        splitContainer.Panel2.Controls.Add(rtbDiff);

        // ChangesPanel
        Controls.Add(splitContainer);
        Controls.Add(lblStatus);
        Controls.Add(pnlTop);
        Name = "ChangesPanel";
        Size = new Size(980, 620);

        pnlTop.ResumeLayout(false);
        splitContainer.Panel1.ResumeLayout(false);
        splitContainer.Panel2.ResumeLayout(false);
        ((ISupportInitialize)splitContainer).EndInit();
        splitContainer.ResumeLayout(false);
        splitLeft.Panel1.ResumeLayout(false);
        splitLeft.Panel2.ResumeLayout(false);
        ((ISupportInitialize)splitLeft).EndInit();
        splitLeft.ResumeLayout(false);
        pnlModelHeader.ResumeLayout(false);
        ResumeLayout(false);
    }
}
